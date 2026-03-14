import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AccountMongoRepository, UserMongoRepository } from '@billing-management/databases';
import { hash } from 'bcrypt';
import { CreateAccountDto } from './dtos/create-account.dto';
import { ListAccountsDto } from './dtos/list-accounts.dto';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    private readonly accountRepository: AccountMongoRepository,
    private readonly userRepository: UserMongoRepository,
  ) {}

  async createAccount(createAccountDto: CreateAccountDto) {
    let createdAccountId: string | null = null;

    this.logger.debug({
      module: AccountsService.name,
      action: 'createAccount',
      phase: 'start',
      email: createAccountDto.email,
      cnpj: createAccountDto.cnpj,
      plan: createAccountDto.plan,
    });

    try {
      const accountByEmail = await this.accountRepository.findByEmail(createAccountDto.email);
      if (accountByEmail) {
        this.logger.debug({
          module: AccountsService.name,
          action: 'createAccount',
          phase: 'failure',
          email: createAccountDto.email,
          reason: 'account_email_already_exists',
        });
        throw new ConflictException('Ja existe uma conta cadastrada com este email.');
      }

      const accountByCnpj = await this.accountRepository.findByCnpj(createAccountDto.cnpj);
      if (accountByCnpj) {
        this.logger.debug({
          module: AccountsService.name,
          action: 'createAccount',
          phase: 'failure',
          cnpj: createAccountDto.cnpj,
          reason: 'account_cnpj_already_exists',
        });
        throw new ConflictException('Ja existe uma conta cadastrada com este CNPJ.');
      }

      const userByEmail = await this.userRepository.findAuthByEmail(createAccountDto.email);
      if (userByEmail) {
        this.logger.debug({
          module: AccountsService.name,
          action: 'createAccount',
          phase: 'failure',
          email: createAccountDto.email,
          reason: 'user_email_already_exists',
        });
        throw new ConflictException('Ja existe um usuario cadastrado com este email.');
      }

      const passwordHash = await hash(createAccountDto.password, 10);
      const account = await this.accountRepository.create({
        name: createAccountDto.name,
        email: createAccountDto.email,
        cnpj: createAccountDto.cnpj,
        plan: createAccountDto.plan,
      });

      const accountId = String((account as unknown as { _id?: unknown })._id);
      createdAccountId = accountId;
      const user = await this.userRepository.create({
        name: createAccountDto.name,
        email: createAccountDto.email,
        password: passwordHash,
        account: accountId,
        role: 'admin',
      });
      const safeUser = this.userRepository.sanitizeUser(user);

      this.logger.debug({
        module: AccountsService.name,
        action: 'createAccount',
        phase: 'success',
        accountId,
        userRole: 'admin',
        email: createAccountDto.email,
      });

      return { account, user: safeUser };
    } catch (error: unknown) {
      const errorDetails = error as { message?: string; stack?: string; code?: string | number };
      const isConflictError = error instanceof ConflictException;
      const duplicateKeyError = error as { code?: number; keyPattern?: Record<string, number> };
      let duplicateConflictException: ConflictException | null = null;

      if (duplicateKeyError?.code === 11000) {
        const duplicatedField = Object.keys(duplicateKeyError.keyPattern || {})[0];
        const duplicatedFieldLabel = duplicatedField === 'cnpj' ? 'CNPJ' : 'email';
        this.logger.debug({
          module: AccountsService.name,
          action: 'createAccount',
          phase: 'failure',
          email: createAccountDto.email,
          cnpj: createAccountDto.cnpj,
          reason: 'duplicate_key',
          duplicatedField,
        });
        duplicateConflictException = new ConflictException(`Ja existe registro com este ${duplicatedFieldLabel}.`);
      }

      this.logger.error(
        {
          module: AccountsService.name,
          action: 'createAccount',
          phase: 'failure',
          accountId: createdAccountId ?? undefined,
          email: createAccountDto.email,
          errorMessage: errorDetails?.message,
          errorCode: errorDetails?.code,
        },
        errorDetails?.stack,
      );

      if (createdAccountId) {
        await this.accountRepository.deleteById(createdAccountId);
        this.logger.debug({
          module: AccountsService.name,
          action: 'createAccount',
          phase: 'rollback',
          accountId: createdAccountId,
          reason: 'user_creation_failed',
        });
      }

      if (duplicateConflictException) {
        throw duplicateConflictException;
      }

      if (isConflictError) {
        throw error;
      }

      throw new HttpException(
        { message: errorDetails?.message, errorCode: errorDetails?.code },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async listAccounts(filters: ListAccountsDto) {
    this.logger.debug({
      module: AccountsService.name,
      action: 'listAccounts',
      phase: 'start',
      filters,
    });

    const accounts = await this.accountRepository.findAll({
      email: filters.email,
      cnpj: filters.cnpj,
    });

    this.logger.debug({
      module: AccountsService.name,
      action: 'listAccounts',
      phase: 'success',
      count: accounts.length,
      filters,
    });

    return { accounts };
  }
}