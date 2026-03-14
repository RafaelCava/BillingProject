import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Purchase } from '../schemas/purchase';

type PurchaseScope = {
  account: string;
  user?: string;
};

@Injectable()
export class PurchaseMongoRepository {
  private readonly logger = new Logger(PurchaseMongoRepository.name);

  constructor(@InjectModel(Purchase.name, 'billing') private purchaseModel: Model<Purchase>) {}

  async create(purchase: Partial<Purchase>): Promise<Purchase> {
    this.logger.debug({
      module: PurchaseMongoRepository.name,
      action: 'create',
      phase: 'start',
      accountId: purchase.account,
      userId: purchase.user,
    });

    const createdPurchase = new this.purchaseModel(purchase);
    const savedPurchase = await createdPurchase.save();

    this.logger.debug({
      module: PurchaseMongoRepository.name,
      action: 'create',
      phase: 'success',
      purchaseId: String((savedPurchase as unknown as { _id?: unknown })._id),
      accountId: savedPurchase.account,
      userId: savedPurchase.user,
    });

    return savedPurchase;
  }

  async findAllByScope(scope: PurchaseScope): Promise<Purchase[]> {
    this.logger.debug({
      module: PurchaseMongoRepository.name,
      action: 'findAllByScope',
      phase: 'start',
      scope,
    });

    const purchases = await this.purchaseModel.find(scope).sort({ purchaseDate: -1 }).lean().exec();

    this.logger.debug({
      module: PurchaseMongoRepository.name,
      action: 'findAllByScope',
      phase: 'success',
      scope,
      count: purchases.length,
    });

    return purchases as Purchase[];
  }

  async findByIdAndScope(purchaseId: string, scope: PurchaseScope): Promise<Purchase | null> {
    this.logger.debug({
      module: PurchaseMongoRepository.name,
      action: 'findByIdAndScope',
      phase: 'start',
      purchaseId,
      scope,
    });

    const purchase = await this.purchaseModel.findOne({ _id: purchaseId, ...scope }).lean().exec();

    this.logger.debug({
      module: PurchaseMongoRepository.name,
      action: 'findByIdAndScope',
      phase: 'success',
      purchaseId,
      scope,
      found: Boolean(purchase),
    });

    return purchase as Purchase | null;
  }

  async updateByIdAndScope(
    purchaseId: string,
    scope: PurchaseScope,
    payload: Partial<Purchase>,
  ): Promise<Purchase | null> {
    this.logger.debug({
      module: PurchaseMongoRepository.name,
      action: 'updateByIdAndScope',
      phase: 'start',
      purchaseId,
      scope,
    });

    const purchase = await this.purchaseModel
      .findOneAndUpdate({ _id: purchaseId, ...scope }, { $set: payload }, { new: true })
      .lean()
      .exec();

    this.logger.debug({
      module: PurchaseMongoRepository.name,
      action: 'updateByIdAndScope',
      phase: 'success',
      purchaseId,
      scope,
      found: Boolean(purchase),
    });

    return purchase as Purchase | null;
  }

  async deleteByIdAndScope(purchaseId: string, scope: PurchaseScope): Promise<boolean> {
    this.logger.debug({
      module: PurchaseMongoRepository.name,
      action: 'deleteByIdAndScope',
      phase: 'start',
      purchaseId,
      scope,
    });

    const result = await this.purchaseModel.deleteOne({ _id: purchaseId, ...scope }).exec();

    this.logger.debug({
      module: PurchaseMongoRepository.name,
      action: 'deleteByIdAndScope',
      phase: 'success',
      purchaseId,
      scope,
      deleted: result.deletedCount > 0,
    });

    return result.deletedCount > 0;
  }
}