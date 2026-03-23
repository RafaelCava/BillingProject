import { Module } from "@nestjs/common";
import { BillsService } from "./bills.service";
import { DatabasesModule } from "@billing-management/databases";

@Module({
  imports: [DatabasesModule],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}