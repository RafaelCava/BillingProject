import { Body, Controller, Get, Logger, Post, Query, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dtos/create-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ListAccountsDto } from './dtos/list-accounts.dto';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  ApiCookieAccessAuth,
  ApiErrorResponse,
  ApiForbiddenResponse,
  ApiSuccessResponse,
  ApiUnauthorizedResponse,
  ApiValidationErrorResponse,
} from '../swagger/swagger.decorators';
import { ACCOUNT_EXAMPLE, ADMIN_USER_EXAMPLE } from '../swagger/swagger.examples';

@ApiTags('Accounts')
@Controller('accounts')
export class AccountsController {
  private readonly logger = new Logger(AccountsController.name);

  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria uma conta',
    description: 'Cria uma nova conta e automaticamente cria o primeiro usuario administrador.',
  })
  @ApiBody({ type: CreateAccountDto })
  @ApiSuccessResponse(201, 'Conta criada com sucesso.', { account: ACCOUNT_EXAMPLE, user: ADMIN_USER_EXAMPLE })
  @ApiValidationErrorResponse('Payload invalido.', {
    statusCode: 400,
    message: ['password must be longer than or equal to 8 characters'],
    error: 'Bad Request',
  })
  @ApiErrorResponse(409, 'Conflito de email ou CNPJ.', {
    statusCode: 409,
    message: 'Ja existe uma conta cadastrada com este email.',
    error: 'Conflict',
  })
  async createAccount(@Body() createAccountDto: CreateAccountDto) {
    this.logger.debug({
      module: AccountsController.name,
      action: 'createAccount',
      phase: 'start',
      email: createAccountDto.email,
      cnpj: createAccountDto.cnpj,
      plan: createAccountDto.plan,
    });

    const result = await this.accountsService.createAccount(createAccountDto);

    this.logger.debug({
      module: AccountsController.name,
      action: 'createAccount',
      phase: 'success',
      email: createAccountDto.email,
      accountCreated: true,
      adminUserCreated: true,
    });

    return result;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiCookieAccessAuth()
  @ApiOperation({
    summary: 'Lista contas',
    description: 'Lista contas do sistema com filtros opcionais por email e CNPJ. Acesso restrito a admin.',
  })
  @ApiQuery({ name: 'email', required: false, example: 'financeiro@empresa.com', description: 'Filtra por email' })
  @ApiQuery({ name: 'cnpj', required: false, example: '12.345.678/0001-90', description: 'Filtra por CNPJ' })
  @ApiSuccessResponse(200, 'Lista de contas retornada com sucesso.', { accounts: [ACCOUNT_EXAMPLE] })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async listAccounts(@Query() filters: ListAccountsDto) {
    this.logger.debug({
      module: AccountsController.name,
      action: 'listAccounts',
      phase: 'start',
      filters,
    });

    const result = await this.accountsService.listAccounts(filters);

    this.logger.debug({
      module: AccountsController.name,
      action: 'listAccounts',
      phase: 'success',
      count: result.accounts.length,
    });

    return result;
  }
}