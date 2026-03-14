import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from '../schemas/account';
import { Purchase, PurchaseSchema } from '../schemas/purchase';
import { Tag, TagSchema } from '../schemas/tag';
import { User, UserSchema } from '../schemas/user';
import { AccountMongoRepository } from '../repositories/account-mongo-repository';
import { PurchaseMongoRepository } from '../repositories/purchase-mongo-repository';
import { TagMongoRepository } from '../repositories/tag-mongo-repository';
import { UserMongoRepository } from '../repositories/user-mongo-repository';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_CONNECTION as string, { connectionName: 'billing' }),
    MongooseModule.forFeature(
      [
        { name: User.name, schema: UserSchema },
        { name: Account.name, schema: AccountSchema },
        { name: Purchase.name, schema: PurchaseSchema },
        { name: Tag.name, schema: TagSchema },
      ],
      'billing',
    ),
  ],
  controllers: [],
  exports: [UserMongoRepository, AccountMongoRepository, PurchaseMongoRepository, TagMongoRepository],
  providers: [UserMongoRepository, AccountMongoRepository, PurchaseMongoRepository, TagMongoRepository],
})
export class DatabasesModule {}
