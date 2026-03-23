import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Bill } from "../schemas/bill";
import { Model } from "mongoose";

@Injectable()
export class BillMongoRepository {
  private readonly logger = new Logger(BillMongoRepository.name);
  constructor(@InjectModel(Bill.name, 'billing') private billModel: Model<Bill>) {}

  async create(bill: Partial<Bill>): Promise<Bill> {
    this.logger.debug({
      module: BillMongoRepository.name,
      action: 'create',
      phase: 'start',
      inputBill: bill,
    });

    const createdBill = new this.billModel(bill);
    const savedBill = await createdBill.save();

    this.logger.debug({
      module: BillMongoRepository.name,
      action: 'create',
      phase: 'success',
      billId: String((savedBill as unknown as { _id?: unknown })._id),
      accountId: savedBill.account,
      purchaseId: savedBill.purchase,
    });

    return savedBill;
  }

  async paginateByAccount(props: { accountId: string; page: number; limit: number, name?: string }): Promise<Bill[]> {
    this.logger.debug({
      module: BillMongoRepository.name,
      action: 'paginateByAccount',
      phase: 'start',
      props,
    });
    const { accountId, page, limit, name } = props;
    const query = { account: accountId } as {  account: string; name?: { $regex: string; $options: string } };
    if (name) {
      query['name'] = { $regex: name, $options: 'i' };
    }
    const bills = await this.billModel
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'purchase', select: 'name tagIds -_id', populate: { path: 'tagIds', select: 'name color -_id' } })
      .populate({ path: 'account', select: 'name cnpj -_id' })
      .lean()
      .exec();
      
    this.logger.debug({
      module: BillMongoRepository.name,
      action: 'paginateByAccount',
      phase: 'success',
      accountId,
      page,
      limit,
      name,
      resultCount: bills.length,
    });
    return bills;
  }

  async updateToPaidById(billId: string): Promise<void> {
    this.logger.debug({
      module: BillMongoRepository.name,
      action: 'updateToPaidById',
      phase: 'start',
      billId,
    });

    await this.billModel.updateOne({ _id: billId }, { isPaid: true, payedAt: new Date() }).exec();

    this.logger.debug({
      module: BillMongoRepository.name,
      action: 'updateToPaidById',
      phase: 'success',
      billId,
    });
  }

  async markAsExpired(billId: string): Promise<void> {
    this.logger.debug({
      module: BillMongoRepository.name,
      action: 'markAsExpired',
      phase: 'start',
      billId,
    });

    await this.billModel.updateOne({ _id: billId }, { isExpired: true }).exec();
    
    this.logger.debug({
      module: BillMongoRepository.name,
      action: 'markAsExpired',
      phase: 'success',
      billId,
    });
  }

  async createBulk(bills: Partial<Bill>[]): Promise<Bill[]> {
    this.logger.debug({
      module: BillMongoRepository.name,
      action: 'createBulk',
      phase: 'start',
      billCount: bills.length,
    });

    const createdBills = await this.billModel.insertMany(bills);

    this.logger.debug({
      module: BillMongoRepository.name,
      action: 'createBulk',
      phase: 'success',
      billCount: createdBills.length,
    });

    return createdBills as Bill[];
  }
}