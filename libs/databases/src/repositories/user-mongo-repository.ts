import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "../schemas/user";
import { Model } from "mongoose";

type UserAuthDocument = User & {
  _id: unknown;
  refreshTokenHash?: string;
};

@Injectable()
export class UserMongoRepository {
  private readonly logger = new Logger(UserMongoRepository.name);

  constructor(@InjectModel(User.name, 'billing') private userModel: Model<User>) {}

  async create(user: Partial<User>): Promise<User> {
    this.logger.debug({
      module: UserMongoRepository.name,
      action: 'create',
      phase: 'start',
      email: user.email,
      role: user.role,
    });
    const createdUser = new this.userModel(user);
    const savedUser = await createdUser.save();
    this.logger.debug({
      module: UserMongoRepository.name,
      action: 'create',
      phase: 'success',
      userId: String((savedUser as unknown as { _id?: unknown })._id),
      email: savedUser.email,
    });
    return savedUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug({ module: UserMongoRepository.name, action: 'findByEmail', phase: 'start', email });
    const user = await this.userModel.findOne({ email }).lean().exec();
    if (user) {
      const safeUser = { ...(user as unknown as Record<string, unknown>) };
      delete safeUser.password;
      delete safeUser.refreshTokenHash;
      this.logger.debug({ module: UserMongoRepository.name, action: 'findByEmail', phase: 'success', email, found: true });
      return safeUser as unknown as User;
    }
    this.logger.debug({ module: UserMongoRepository.name, action: 'findByEmail', phase: 'success', email, found: false });
    return null;
  }

  async findAuthByEmail(email: string): Promise<UserAuthDocument | null> {
    this.logger.debug({ module: UserMongoRepository.name, action: 'findAuthByEmail', phase: 'start', email });
    const user = await this.userModel.findOne({ email }).lean().exec();
    this.logger.debug({
      module: UserMongoRepository.name,
      action: 'findAuthByEmail',
      phase: 'success',
      email,
      found: Boolean(user),
    });
    return user as UserAuthDocument | null;
  }

  async findAuthById(id: string): Promise<UserAuthDocument | null> {
    this.logger.debug({ module: UserMongoRepository.name, action: 'findAuthById', phase: 'start', userId: id });
    const user = await this.userModel.findById(id).lean().exec();
    this.logger.debug({
      module: UserMongoRepository.name,
      action: 'findAuthById',
      phase: 'success',
      userId: id,
      found: Boolean(user),
    });
    return user as UserAuthDocument | null;
  }

  async updateRefreshTokenHash(userId: string, refreshTokenHash: string | null): Promise<void> {
    this.logger.debug({
      module: UserMongoRepository.name,
      action: 'updateRefreshTokenHash',
      phase: 'start',
      userId,
      operation: refreshTokenHash ? 'set' : 'unset',
    });
    if (refreshTokenHash) {
      await this.userModel
        .updateOne({ _id: userId }, { $set: { refreshTokenHash } })
        .exec();
      this.logger.debug({
        module: UserMongoRepository.name,
        action: 'updateRefreshTokenHash',
        phase: 'success',
        userId,
        operation: 'set',
      });
      return;
    }

    await this.userModel
      .updateOne({ _id: userId }, { $unset: { refreshTokenHash: 1 } })
      .exec();
    this.logger.debug({
      module: UserMongoRepository.name,
      action: 'updateRefreshTokenHash',
      phase: 'success',
      userId,
      operation: 'unset',
    });
  }
}
