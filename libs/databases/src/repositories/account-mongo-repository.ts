import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account } from '../schemas/account';

@Injectable()
export class AccountMongoRepository {
  private readonly logger = new Logger(AccountMongoRepository.name);

  constructor(@InjectModel(Account.name, 'billing') private accountModel: Model<Account>) {}

  async create(account: Partial<Account>): Promise<Account> {
    this.logger.debug({
      module: AccountMongoRepository.name,
      action: 'create',
      phase: 'start',
      email: account.email,
      cnpj: account.cnpj,
      plan: account.plan,
    });
    const createdAccount = new this.accountModel(account);
    const savedAccount = await createdAccount.save();
    this.logger.debug({
      module: AccountMongoRepository.name,
      action: 'create',
      phase: 'success',
      accountId: String((savedAccount as unknown as { _id?: unknown })._id),
      email: savedAccount.email,
      cnpj: savedAccount.cnpj,
    });
    return savedAccount;
  }

  async deleteById(accountId: string): Promise<void> {
    this.logger.debug({
      module: AccountMongoRepository.name,
      action: 'deleteById',
      phase: 'start',
      accountId,
    });
    await this.accountModel.deleteOne({ _id: accountId }).exec();
    this.logger.debug({
      module: AccountMongoRepository.name,
      action: 'deleteById',
      phase: 'success',
      accountId,
    });
  }

  async findByEmail(email: string): Promise<Account | null> {
    this.logger.debug({ module: AccountMongoRepository.name, action: 'findByEmail', phase: 'start', email });
    const account = await this.accountModel.findOne({ email }).lean().exec();
    this.logger.debug({
      module: AccountMongoRepository.name,
      action: 'findByEmail',
      phase: 'success',
      email,
      found: Boolean(account),
    });
    return account as Account | null;
  }

  async findByCnpj(cnpj: string): Promise<Account | null> {
    this.logger.debug({ module: AccountMongoRepository.name, action: 'findByCnpj', phase: 'start', cnpj });
    const account = await this.accountModel.findOne({ cnpj }).lean().exec();
    this.logger.debug({
      module: AccountMongoRepository.name,
      action: 'findByCnpj',
      phase: 'success',
      cnpj,
      found: Boolean(account),
    });
    return account as Account | null;
  }

  async findAll(filters?: { email?: string; cnpj?: string }): Promise<Account[]> {
    this.logger.debug({
      module: AccountMongoRepository.name,
      action: 'findAll',
      phase: 'start',
      filters,
    });
    const query: Record<string, string> = {};
    if (filters?.email) {
      query.email = filters.email;
    }
    if (filters?.cnpj) {
      query.cnpj = filters.cnpj;
    }

    const accounts = await this.accountModel.find(query).lean().exec();
    this.logger.debug({
      module: AccountMongoRepository.name,
      action: 'findAll',
      phase: 'success',
      count: accounts.length,
      filters,
    });
    return accounts as Account[];
  }
}