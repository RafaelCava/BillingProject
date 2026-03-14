import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "../schemas/user";
import { Model } from "mongoose";

type UserAuthDocument = User & {
  _id: unknown;
  refreshTokenHash?: string;
};

@Injectable()
export class UserMongoRepository {
  constructor(@InjectModel(User.name, 'billing') private userModel: Model<User>) {}

  async create(user: User): Promise<User> {
    const createdUser = new this.userModel(user);
    return await createdUser.save()
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).lean().exec();
    if (user) {
      const safeUser = { ...(user as unknown as Record<string, unknown>) };
      delete safeUser.password;
      delete safeUser.refreshTokenHash;
      return safeUser as unknown as User;
    }
    return null;
  }

  async findAuthByEmail(email: string): Promise<UserAuthDocument | null> {
    return this.userModel.findOne({ email }).lean().exec() as Promise<UserAuthDocument | null>;
  }

  async findAuthById(id: string): Promise<UserAuthDocument | null> {
    return this.userModel.findById(id).lean().exec() as Promise<UserAuthDocument | null>;
  }

  async updateRefreshTokenHash(userId: string, refreshTokenHash: string | null): Promise<void> {
    if (refreshTokenHash) {
      await this.userModel
        .updateOne({ _id: userId }, { $set: { refreshTokenHash } })
        .exec();
      return;
    }

    await this.userModel
      .updateOne({ _id: userId }, { $unset: { refreshTokenHash: 1 } })
      .exec();
  }
}
