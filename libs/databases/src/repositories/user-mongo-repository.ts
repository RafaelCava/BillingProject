import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "../schemas/user";
import { Model } from "mongoose";

@Injectable()
export class UserMongoRepository {
  constructor(@InjectModel(User.name, 'billing') private userModel: Model<User>) {}

  async create(user: User): Promise<User> {
    const createdUser = new this.userModel(user);
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).lean().exec();
    if (user) {
      delete user.password;
      return user as User;
    }
    return null;
  }
}
