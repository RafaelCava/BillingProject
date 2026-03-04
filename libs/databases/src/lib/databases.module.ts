import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user';
import { UserMongoRepository } from '../repositories/user-mongo-repository';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_CONNECTION as string, { connectionName: 'billing' }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }], 'billing'),
  ],
  controllers: [],
  exports: [UserMongoRepository],
  providers: [UserMongoRepository],
})
export class DatabasesModule {}
