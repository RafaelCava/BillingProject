import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserMongoRepository } from '@billing-management/databases';
import { compare, hash } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: UserMongoRepository) {}

  async login(email: string, password: string) {
    const user = await this.userRepository.findAuthByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const tokens = this.generateTokens({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });

    const refreshTokenHash = await hash(tokens.refreshToken, 10);
    await this.userRepository.updateRefreshTokenHash(String(user._id), refreshTokenHash);

    return tokens;
  }

  async refresh(refreshToken: string) {
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'billing-refresh-secret';

    let payload: JwtPayload;
    try {
      payload = verify(refreshToken, refreshTokenSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    const user = await this.userRepository.findAuthById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    const isRefreshTokenValid = await compare(refreshToken, user.refreshTokenHash);
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    const tokens = this.generateTokens({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });

    const newRefreshTokenHash = await hash(tokens.refreshToken, 10);
    await this.userRepository.updateRefreshTokenHash(String(user._id), newRefreshTokenHash);

    return tokens;
  }

  async logout(userId: string) {
    await this.userRepository.updateRefreshTokenHash(userId, null);
    return { success: true };
  }

  private generateTokens(payload: JwtPayload) {
    const accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'billing-access-secret';
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'billing-refresh-secret';

    const accessToken = sign(payload, accessTokenSecret, { expiresIn: '15m' });
    const refreshToken = sign(payload, refreshTokenSecret, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
    };
  }
}