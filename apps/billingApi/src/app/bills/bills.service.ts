import { Injectable } from "@nestjs/common";
import { BillMongoRepository } from "@billing-management/databases";
import { CreateBillDto } from "./dtos/create-bill.dto";

@Injectable()
export class BillsService {
  constructor(private readonly billRepository: BillMongoRepository) {}
  
  async create(createBillDto: CreateBillDto) {
    if (createBillDto.installmentCount > 1) {
      const bills = [];
      for (let i = 0; i < createBillDto.installmentCount; i++) {
        bills.push({
          account: createBillDto.accountId,
          purchase: createBillDto.purchaseId,
          name: `${createBillDto.name} - ${i + 1}/${createBillDto.installmentCount}`,
          installmentDate: new Date(new Date(createBillDto.purchaseDate).setMonth(new Date(createBillDto.purchaseDate).getMonth() + i)),
          value: Number((createBillDto.totalAmount / createBillDto.installmentCount).toFixed(2)),
        })
      }
      return this.billRepository.createBulk(bills);
    } else {
      return this.billRepository.create({
        account: createBillDto.accountId,
        purchase: createBillDto.purchaseId,
        name: `${createBillDto.name} - 1/1`,
        installmentDate: createBillDto.purchaseDate,
        value: createBillDto.totalAmount,
      });
    }
  }
}