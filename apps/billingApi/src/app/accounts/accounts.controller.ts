import { Body, Controller, Get, Logger, Post, Query, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dtos/create-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ListAccountsDto } from './dtos/list-accounts.dto';

@Controller('accounts')
export class AccountsController {
  private readonly logger = new Logger(AccountsController.name);

  constructor(private readonly accountsService: AccountsService) {}

  @Post()
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