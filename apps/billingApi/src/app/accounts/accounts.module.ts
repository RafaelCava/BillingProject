import { Module } from '@nestjs/common';
import { DatabasesModule } from '@billing-management/databases';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

@Module({
  imports: [DatabasesModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}