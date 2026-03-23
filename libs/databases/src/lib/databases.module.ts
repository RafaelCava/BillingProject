import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from '../schemas/account';
import { Purchase, PurchaseSchema } from '../schemas/purchase';
import { Bill, BillSchema } from '../schemas/bill';
import { Tag, TagSchema } from '../schemas/tag';
import { User, UserSchema } from '../schemas/user';
import { AccountMongoRepository } from '../repositories/account-mongo-repository';
import { PurchaseMongoRepository } from '../repositories/purchase-mongo-repository';
import { TagMongoRepository } from '../repositories/tag-mongo-repository';
import { UserMongoRepository } from '../repositories/user-mongo-repository';
import { BillMongoRepository } from '../repositories/bill-mongo-repository';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_CONNECTION as string, { connectionName: 'billing' }),
    MongooseModule.forFeature(
      [
        { name: User.name, schema: UserSchema },
        { name: Account.name, schema: AccountSchema },
        { name: Purchase.name, schema: PurchaseSchema },
        { name: Tag.name, schema: TagSchema },
        { name: Bill.name, schema: BillSchema }
      ],
      'billing',
    ),
  ],
  controllers: [],
  exports: [UserMongoRepository, AccountMongoRepository, PurchaseMongoRepository, TagMongoRepository, BillMongoRepository],
  providers: [UserMongoRepository, AccountMongoRepository, PurchaseMongoRepository, TagMongoRepository, BillMongoRepository],
})
export class DatabasesModule {}
