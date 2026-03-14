import { Body, Controller, Logger, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  buildAccessTokenCookieOptions,
  buildExpiredCookieOptions,
  buildRefreshTokenCookieOptions,
  parseCookieHeader,
} from './auth-cookie.util';

type CookieResponse = {
  cookie: (name: string, value: string, options: Record<string, unknown>) => void;
};

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: CookieResponse) {
    this.logger.debug({ module: AuthController.name, action: 'login', phase: 'start', email: loginDto.email });
    const tokens = await this.authService.login(loginDto.email, loginDto.password);
    response.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, buildAccessTokenCookieOptions());
    response.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, buildRefreshTokenCookieOptions());
    this.logger.debug({
      module: AuthController.name,
      action: 'login',
      phase: 'success',
      email: loginDto.email,
      cookiesSet: [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE],
    });

    return { success: true };
  }

  @Post('refresh')
  async refresh(
    @Req() req: { headers?: { cookie?: string } },
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    const cookies = parseCookieHeader(req.headers?.cookie);
    const refreshToken = cookies[REFRESH_TOKEN_COOKIE];
    this.logger.debug({
      module: AuthController.name,
      action: 'refresh',
      phase: 'start',
      hasRefreshToken: Boolean(refreshToken),
    });
    const tokens = await this.authService.refresh(refreshToken);

    response.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, buildAccessTokenCookieOptions());
    response.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, buildRefreshTokenCookieOptions());
    this.logger.debug({
      module: AuthController.name,
      action: 'refresh',
      phase: 'success',
      cookiesSet: [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE],
    });

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() req: { user: { sub: string } },
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    this.logger.debug({ module: AuthController.name, action: 'logout', phase: 'start', userId: req.user.sub });
    await this.authService.logout(req.user.sub);
    response.cookie(ACCESS_TOKEN_COOKIE, '', buildExpiredCookieOptions());
    response.cookie(REFRESH_TOKEN_COOKIE, '', buildExpiredCookieOptions());
    this.logger.debug({
      module: AuthController.name,
      action: 'logout',
      phase: 'success',
      userId: req.user.sub,
      cookiesCleared: [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE],
    });

    return { success: true };
  }
}