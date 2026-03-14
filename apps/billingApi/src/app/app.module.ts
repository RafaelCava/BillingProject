import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { AppService } from './app.service';
import { DatabasesModule } from '@billing-management/databases';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { PurchasesModule } from './purchases/purchases.module';
import { TagsModule } from './tags/tags.module';

@Module({
  imports: [DatabasesModule, AuthModule, AccountsModule, PurchasesModule, TagsModule],
  controllers: [UserController],
  providers: [AppService],
})
export class AppModule {}
