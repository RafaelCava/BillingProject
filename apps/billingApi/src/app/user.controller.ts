import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserMongoRepository } from '@billing-management/databases';
import { CreateUserDto } from './dtos/createUserDto';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { hash } from 'bcrypt';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  ApiCookieAccessAuth,
  ApiErrorResponse,
  ApiForbiddenResponse,
  ApiSuccessResponse,
  ApiUnauthorizedResponse,
  ApiValidationErrorResponse,
} from './swagger/swagger.decorators';
import { USER_EXAMPLE } from './swagger/swagger.examples';

@ApiTags('Users')
@Controller()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userRepository: UserMongoRepository
  ) {}

  @Get('/user')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'user')
  @ApiCookieAccessAuth()
  @ApiOperation({
    summary: 'Busca um usuario por email',
    description: 'Busca um usuario da mesma conta do usuario autenticado usando o email informado.',
  })
  @ApiQuery({ name: 'email', required: true, example: 'maria@empresa.com', description: 'Email do usuario a ser consultado' })
  @ApiSuccessResponse(200, 'Usuario encontrado ou retorno nulo quando nao existir.', USER_EXAMPLE)
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async getUser(@Query('email') email: string, @Req() req: { user: { sub: string; accountId: string } }) {
    this.logger.debug({ module: UserController.name, action: 'getUser', phase: 'start', email });
    const user = await this.userRepository.findByEmail(email, req.user.accountId);
    this.logger.debug({
      module: UserController.name,
      action: 'getUser',
      phase: 'success',
      email,
      found: Boolean(user),
    });
    return user
  }

  @Get('/users')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiCookieAccessAuth()
  @ApiOperation({
    summary: 'Lista usuarios da conta',
    description: 'Lista todos os usuarios vinculados ao accountId presente no token do usuario autenticado.',
  })
  @ApiSuccessResponse(200, 'Lista de usuarios retornada com sucesso.', { users: [USER_EXAMPLE] })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async listUsersByAccount(@Req() req: { user: { sub: string; accountId: string } }) {
    const accountId = req.user.accountId;
    this.logger.debug({
      module: UserController.name,
      action: 'listUsersByAccount',
      phase: 'start',
      accountId,
      requesterUserId: req.user.sub,
    });

    const users = await this.userRepository.findByAccountId(accountId);

    this.logger.debug({
      module: UserController.name,
      action: 'listUsersByAccount',
      phase: 'success',
      accountId,
      count: users.length,
    });

    return { users };
  }

  @Post('/user')
  @ApiOperation({
    summary: 'Cria um usuario',
    description: 'Cria um novo usuario manualmente informando account, email, senha e perfil.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiSuccessResponse(201, 'Usuario criado com sucesso.', { user: USER_EXAMPLE })
  @ApiValidationErrorResponse('Payload invalido.', {
    statusCode: 400,
    message: ['email must be an email'],
    error: 'Bad Request',
  })
  @ApiErrorResponse(500, 'Falha ao criar usuario.', {
    statusCode: 500,
    message: 'duplicate key error',
    errorCode: 11000,
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      this.logger.debug({
        module: UserController.name,
        action: 'createUser',
        phase: 'start',
        email: createUserDto.email,
        role: createUserDto.role ?? 'user',
      });
      const passwordHash = await hash(createUserDto.password, 10);
      const user = await this.userRepository.create({
        ...createUserDto,
        role: createUserDto.role ?? 'user',
        password: passwordHash,
      });
      const safeUser = this.userRepository.sanitizeUser(user);
      this.logger.debug({
        module: UserController.name,
        action: 'createUser',
        phase: 'success',
        email: createUserDto.email,
        hasUser: Boolean(user),
      });
      return { user: safeUser }
    } catch (error: unknown) {
      const errorDetails = error as { message?: string; stack?: string; code?: string | number };
      this.logger.error(
        {
          module: UserController.name,
          action: 'createUser',
          phase: 'failure',
          email: createUserDto.email,
          errorMessage: errorDetails?.message,
          errorCode: errorDetails?.code,
        },
        errorDetails?.stack,
      );
      throw new HttpException({message: errorDetails?.message, errorCode: errorDetails?.code}, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
