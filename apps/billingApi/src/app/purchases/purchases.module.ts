import { Module } from '@nestjs/common';
import { DatabasesModule } from '@billing-management/databases';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { BillsModule } from '../bills/bills.module';

@Module({
  imports: [DatabasesModule, BillsModule],
  controllers: [PurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}