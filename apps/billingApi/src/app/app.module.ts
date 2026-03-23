import { Module } from '@nestjs/common';
import { DatabasesModule } from '@billing-management/databases';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { PurchasesModule } from './purchases/purchases.module';
import { TagsModule } from './tags/tags.module';
import { SwaggerDocsModule } from './swagger/swagger.module';
import { UsersModule } from './users/users.module';
import { BillsModule } from './bills/bills.module';

@Module({
  imports: [DatabasesModule, AuthModule, AccountsModule, PurchasesModule, TagsModule, SwaggerDocsModule, UsersModule, BillsModule],
})
export class AppModule {}
