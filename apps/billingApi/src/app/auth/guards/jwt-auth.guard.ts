import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verify } from 'jsonwebtoken';
import { ACCESS_TOKEN_COOKIE, parseCookieHeader } from '../auth-cookie.util';
import { ROLES_KEY } from '../decorators/roles.decorator';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  accountId: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const cookies = parseCookieHeader(request.headers?.cookie as string | undefined);
    const token = cookies[ACCESS_TOKEN_COOKIE];

    this.logger.debug(
      {
        module: JwtAuthGuard.name,
        action: 'canActivate',
        phase: 'start',
        path: request.url,
        method: request.method,
        hasAccessToken: Boolean(token),
        requiredRoles,
      }
    );

    if (!token) {
      this.logger.debug({
        module: JwtAuthGuard.name,
        action: 'canActivate',
        phase: 'failure',
        path: request.url,
        reason: 'missing_access_token',
      });
      throw new UnauthorizedException('Token ausente ou inválido.');
    }

    const accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'billing-access-secret';

    try {
      const payload = verify(token, accessTokenSecret) as JwtPayload;
      this.logger.debug(
        {
          module: JwtAuthGuard.name,
          action: 'canActivate',
          phase: 'validated',
          userId: payload.sub,
          role: payload.role,
          accountId: payload.accountId,
          path: request.url,
        }
      );

      if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(payload.role)) {
        this.logger.debug(
          {
            module: JwtAuthGuard.name,
            action: 'canActivate',
            phase: 'failure',
            userId: payload.sub,
            role: payload.role,
            requiredRoles,
            reason: 'role_not_allowed',
          }
        );
        throw new ForbiddenException('Perfil sem permissão para acessar este recurso.');
      }

      request.user = payload;
      this.logger.debug(
        {
          module: JwtAuthGuard.name,
          action: 'canActivate',
          phase: 'success',
          userId: payload.sub,
          accountId: payload.accountId,
          path: request.url,
        }
      );
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.warn(
        {
          module: JwtAuthGuard.name,
          action: 'canActivate',
          phase: 'failure',
          path: request.url,
          reason: 'token_verification_failed',
          errorMessage: (error as Error).message,
        }
      );
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
  }
}