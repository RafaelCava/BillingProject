import { Body, Controller, Get, Logger, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiCookieAccessAuth,
  ApiErrorResponse,
  ApiForbiddenResponse,
  ApiSuccessResponse,
  ApiUnauthorizedResponse,
  ApiValidationErrorResponse,
} from '../swagger/swagger.decorators';
import { USER_EXAMPLE } from '../swagger/swagger.examples';
import { CreateUserDto } from './dtos/create-user.dto';
import { GetUserQueryDto } from './dtos/get-user-query.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('/user')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'user')
  @ApiCookieAccessAuth()
  @ApiOperation({
    summary: 'Busca um usuario por email',
    description: 'Busca um usuario da mesma conta do usuario autenticado usando o email informado.',
  })
  @ApiSuccessResponse(200, 'Usuario encontrado ou retorno nulo quando nao existir.', USER_EXAMPLE)
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async getUser(@Query() query: GetUserQueryDto, @Req() req: { user: { sub: string; accountId: string } }) {
    this.logger.debug({ module: UsersController.name, action: 'getUser', phase: 'start', email: query.email });

    return this.usersService.getUserByEmail(query.email, req.user.accountId);
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
      module: UsersController.name,
      action: 'listUsersByAccount',
      phase: 'start',
      accountId,
      requesterUserId: req.user.sub,
    });

    return this.usersService.listUsersByAccount(accountId);
  }

  @Post('/user')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiCookieAccessAuth()
  @ApiOperation({
    summary: 'Cria um usuario',
    description: 'Cria um novo usuario na conta do usuario autenticado.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiSuccessResponse(201, 'Usuario criado com sucesso.', { user: USER_EXAMPLE })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiValidationErrorResponse('Payload invalido.', {
    statusCode: 400,
    message: ['email must be an email'],
    error: 'Bad Request',
  })
  @ApiErrorResponse(409, 'Usuario ja existente.', {
    statusCode: 409,
    message: 'Ja existe um usuario cadastrado com este email nesta conta.',
    error: 'Conflict',
  })
  @ApiErrorResponse(500, 'Falha ao criar usuario.', {
    statusCode: 500,
    message: 'duplicate key error',
    errorCode: 11000,
  })
  async createUser(@Body() createUserDto: CreateUserDto, @Req() req: { user: { accountId: string } }) {
    return this.usersService.createUser(createUserDto, req.user.accountId);
  }
}