import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserMongoRepository } from '@billing-management/databases';
import { compare, hash } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  accountId: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly userRepository: UserMongoRepository) {}

  async login(email: string, password: string) {
    this.logger.debug({ module: AuthService.name, action: 'login', phase: 'start', email });
    const user = await this.userRepository.findAuthByEmail(email);

    if (!user) {
      this.logger.debug({ module: AuthService.name, action: 'login', phase: 'failure', email, reason: 'user_not_found' });
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.debug({
        module: AuthService.name,
        action: 'login',
        phase: 'failure',
        email,
        userId: String(user._id),
        reason: 'invalid_password',
      });
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    this.logger.debug({
      module: AuthService.name,
      action: 'login',
      phase: 'validated',
      userId: String(user._id),
      role: user.role,
    });

    const tokens = this.generateTokens({
      sub: String(user._id),
      email: user.email,
      role: user.role,
      accountId: user.account,
    });

    const refreshTokenHash = await hash(tokens.refreshToken, 10);
    await this.userRepository.updateRefreshTokenHash(String(user._id), refreshTokenHash);
    this.logger.debug({
      module: AuthService.name,
      action: 'login',
      phase: 'success',
      userId: String(user._id),
      refreshTokenStored: true,
    });

    return tokens;
  }

  async refresh(refreshToken: string) {
    this.logger.debug({
      module: AuthService.name,
      action: 'refresh',
      phase: 'start',
      hasRefreshToken: Boolean(refreshToken),
    });
    if (!refreshToken) {
      this.logger.debug({ module: AuthService.name, action: 'refresh', phase: 'failure', reason: 'missing_refresh_token' });
      throw new UnauthorizedException('Refresh token ausente.');
    }

    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'billing-refresh-secret';

    let payload: JwtPayload;
    try {
      payload = verify(refreshToken, refreshTokenSecret) as JwtPayload;
      this.logger.debug({
        module: AuthService.name,
        action: 'refresh',
        phase: 'validated',
        userId: payload.sub,
        role: payload.role,
      });
    } catch {
      this.logger.debug({ module: AuthService.name, action: 'refresh', phase: 'failure', reason: 'invalid_refresh_token' });
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    const user = await this.userRepository.findAuthById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      this.logger.debug({
        module: AuthService.name,
        action: 'refresh',
        phase: 'failure',
        userId: payload.sub,
        reason: 'refresh_token_not_stored',
      });
      throw new UnauthorizedException('Refresh token inválido.');
    }

    const isRefreshTokenValid = await compare(refreshToken, user.refreshTokenHash);
    if (!isRefreshTokenValid) {
      this.logger.debug({
        module: AuthService.name,
        action: 'refresh',
        phase: 'failure',
        userId: payload.sub,
        reason: 'refresh_token_hash_mismatch',
      });
      throw new UnauthorizedException('Refresh token inválido.');
    }

    this.logger.debug({
      module: AuthService.name,
      action: 'refresh',
      phase: 'verified',
      userId: String(user._id),
    });

    const tokens = this.generateTokens({
      sub: String(user._id),
      email: user.email,
      role: user.role,
      accountId: user.account,
    });

    const newRefreshTokenHash = await hash(tokens.refreshToken, 10);
    await this.userRepository.updateRefreshTokenHash(String(user._id), newRefreshTokenHash);
    this.logger.debug({
      module: AuthService.name,
      action: 'refresh',
      phase: 'success',
      userId: String(user._id),
      refreshTokenRotated: true,
    });

    return tokens;
  }

  async logout(userId: string) {
    this.logger.debug({ module: AuthService.name, action: 'logout', phase: 'start', userId });
    await this.userRepository.updateRefreshTokenHash(userId, null);
    this.logger.debug({ module: AuthService.name, action: 'logout', phase: 'success', userId, refreshTokenStored: false });
    return { success: true };
  }

  private generateTokens(payload: JwtPayload) {
    const accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'billing-access-secret';
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'billing-refresh-secret';

    const accessToken = sign(payload, accessTokenSecret, { expiresIn: '15m' });
    const refreshToken = sign(payload, refreshTokenSecret, { expiresIn: '7d' });

    this.logger.debug({
      module: AuthService.name,
      action: 'generateTokens',
      phase: 'success',
      userId: payload.sub,
      role: payload.role,
      accountId: payload.accountId,
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}