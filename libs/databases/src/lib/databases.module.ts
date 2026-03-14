import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from '../schemas/account';
import { User, UserSchema } from '../schemas/user';
import { AccountMongoRepository } from '../repositories/account-mongo-repository';
import { UserMongoRepository } from '../repositories/user-mongo-repository';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_CONNECTION as string, { connectionName: 'billing' }),
    MongooseModule.forFeature(
      [
        { name: User.name, schema: UserSchema },
        { name: Account.name, schema: AccountSchema },
      ],
      'billing',
    ),
  ],
  controllers: [],
  exports: [UserMongoRepository, AccountMongoRepository],
  providers: [UserMongoRepository, AccountMongoRepository],
})
export class DatabasesModule {}
