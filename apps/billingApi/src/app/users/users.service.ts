import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserMongoRepository } from '@billing-management/databases';
import { hash } from 'bcrypt';
import { CreateUserDto } from './dtos/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly userRepository: UserMongoRepository) {}

  async getUserByEmail(email: string, accountId: string) {
    this.logger.debug({
      module: UsersService.name,
      action: 'getUserByEmail',
      phase: 'start',
      email,
      accountId,
    });

    const user = await this.userRepository.findByEmail(email, accountId);

    this.logger.debug({
      module: UsersService.name,
      action: 'getUserByEmail',
      phase: 'success',
      email,
      accountId,
      found: Boolean(user),
    });

    return user;
  }

  async listUsersByAccount(accountId: string) {
    this.logger.debug({
      module: UsersService.name,
      action: 'listUsersByAccount',
      phase: 'start',
      accountId,
    });

    const users = await this.userRepository.findByAccountId(accountId);

    this.logger.debug({
      module: UsersService.name,
      action: 'listUsersByAccount',
      phase: 'success',
      accountId,
      count: users.length,
    });

    return { users };
  }

  async getProfile(userId: string, accountId: string) {
    this.logger.debug({
      module: UsersService.name,
      action: 'getProfile',
      phase: 'start',
      userId,
      accountId,
    });

    const user = await this.userRepository.findByIdAndAccountWithPopulatedAccount(userId, accountId);

    if (!user) {
      this.logger.debug({
        module: UsersService.name,
        action: 'getProfile',
        phase: 'failure',
        userId,
        accountId,
        reason: 'user_not_found',
      });
      throw new NotFoundException('Usuario nao encontrado.');
    }

    this.logger.debug({
      module: UsersService.name,
      action: 'getProfile',
      phase: 'success',
      userId,
      accountId,
    });

    return user;
  }

  async createUser(createUserDto: CreateUserDto, accountId: string) {
    try {
      this.logger.debug({
        module: UsersService.name,
        action: 'createUser',
        phase: 'start',
        email: createUserDto.email,
        accountId,
        role: createUserDto.role ?? 'user',
      });

      const passwordHash = await hash(createUserDto.password, 10);
      const user = await this.userRepository.create({
        name: createUserDto.name,
        email: createUserDto.email,
        account: accountId,
        role: createUserDto.role ?? 'user',
        password: passwordHash,
      });

      const safeUser = this.userRepository.sanitizeUser(user);

      this.logger.debug({
        module: UsersService.name,
        action: 'createUser',
        phase: 'success',
        email: createUserDto.email,
        accountId,
        hasUser: Boolean(user),
      });

      return { user: safeUser };
    } catch (error: unknown) {
      const errorDetails = error as { message?: string; stack?: string; code?: string | number };
      const duplicateKeyError = error as { code?: number };

      this.logger.error(
        {
          module: UsersService.name,
          action: 'createUser',
          phase: 'failure',
          email: createUserDto.email,
          accountId,
          errorMessage: errorDetails?.message,
          errorCode: errorDetails?.code,
        },
        errorDetails?.stack,
      );

      if (duplicateKeyError?.code === 11000) {
        throw new ConflictException('Ja existe um usuario cadastrado com este email nesta conta.');
      }

      throw new HttpException(
        { message: errorDetails?.message, errorCode: errorDetails?.code },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}