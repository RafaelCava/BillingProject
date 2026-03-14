import { Module } from '@nestjs/common';
import { DatabasesModule } from '@billing-management/databases';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';

@Module({
  imports: [DatabasesModule],
  controllers: [PurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}