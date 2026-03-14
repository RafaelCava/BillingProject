import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatabasesModule } from '@billing-management/databases';

@Module({
  imports: [DatabasesModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}