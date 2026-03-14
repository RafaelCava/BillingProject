import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization as string | undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token ausente ou inválido.');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'billing-access-secret';

    try {
      const payload = verify(token, accessTokenSecret) as JwtPayload;
      request.user = payload;
      return true;
    } catch (error) {
      Logger.warn(
        { function: 'canActivate', message: (error as Error).message },
        'JwtAuthGuard',
      );
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
  }
}