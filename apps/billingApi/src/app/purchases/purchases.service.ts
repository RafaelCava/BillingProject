import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PurchaseMongoRepository } from '@billing-management/databases';
import { CreatePurchaseDto } from './dtos/create-purchase.dto';
import { UpdatePurchaseDto } from './dtos/update-purchase.dto';

type RequestUser = {
  sub: string;
  role: string;
  accountId: string;
};

type PurchaseScope = {
  account: string;
  user?: string;
};

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(private readonly purchaseRepository: PurchaseMongoRepository) {}

  async create(createPurchaseDto: CreatePurchaseDto, requestUser: RequestUser) {
    const installmentsCount = createPurchaseDto.installmentsCount ?? 1;
    const purchaseDate = new Date(createPurchaseDto.purchaseDate);
    const dueDate = new Date();
    const installmentsEndDate = this.calculateInstallmentsEndDate(purchaseDate, installmentsCount);

    this.logger.debug({
      module: PurchasesService.name,
      action: 'create',
      phase: 'start',
      accountId: requestUser.accountId,
      userId: requestUser.sub,
      installmentsCount,
    });

    const purchase = await this.purchaseRepository.create({
      account: requestUser.accountId,
      user: requestUser.sub,
      purchaseDate,
      totalAmount: createPurchaseDto.totalAmount,
      installmentsCount,
      installmentsEndDate,
      dueDate,
      tagIds: createPurchaseDto.tagIds ?? [],
      name: createPurchaseDto.name,
    });

    this.logger.debug({
      module: PurchasesService.name,
      action: 'create',
      phase: 'success',
      accountId: requestUser.accountId,
      userId: requestUser.sub,
      purchaseId: String((purchase as unknown as { _id?: unknown })._id),
    });

    return { purchase };
  }

  async findAll(requestUser: RequestUser, query: { page?: number; limit?: number; name?: string }) {
    const scope = this.buildScope(requestUser);
    this.logger.debug({
      module: PurchasesService.name,
      action: 'findAll',
      phase: 'start',
      scope,
    });

    const purchases = await this.purchaseRepository.findAllByScope(scope, { limit: query.limit ?? 20, page: query.page ?? 1, name: query.name });

    this.logger.debug({
      module: PurchasesService.name,
      action: 'findAll',
      phase: 'success',
      scope,
      count: purchases.length,
    });

    return { purchases };
  }

  async findOne(purchaseId: string, requestUser: RequestUser) {
    const scope = this.buildScope(requestUser);
    this.logger.debug({
      module: PurchasesService.name,
      action: 'findOne',
      phase: 'start',
      purchaseId,
      scope,
    });

    const purchase = await this.purchaseRepository.findByIdAndScope(purchaseId, scope);
    if (!purchase) {
      this.logger.debug({
        module: PurchasesService.name,
        action: 'findOne',
        phase: 'failure',
        purchaseId,
        scope,
        reason: 'purchase_not_found',
      });
      throw new NotFoundException('Compra nao encontrada.');
    }

    this.logger.debug({
      module: PurchasesService.name,
      action: 'findOne',
      phase: 'success',
      purchaseId,
      scope,
    });

    return { purchase };
  }

  async update(purchaseId: string, updatePurchaseDto: UpdatePurchaseDto, requestUser: RequestUser) {
    const scope = this.buildScope(requestUser);
    this.logger.debug({
      module: PurchasesService.name,
      action: 'update',
      phase: 'start',
      purchaseId,
      scope,
    });

    const currentPurchase = await this.purchaseRepository.findByIdAndScope(purchaseId, scope);
    if (!currentPurchase) {
      this.logger.debug({
        module: PurchasesService.name,
        action: 'update',
        phase: 'failure',
        purchaseId,
        scope,
        reason: 'purchase_not_found',
      });
      throw new NotFoundException('Compra nao encontrada.');
    }

    const purchaseDate = updatePurchaseDto.purchaseDate
      ? new Date(updatePurchaseDto.purchaseDate)
      : new Date(currentPurchase.purchaseDate);
    const installmentsCount = updatePurchaseDto.installmentsCount ?? currentPurchase.installmentsCount;
    const installmentsEndDate = this.calculateInstallmentsEndDate(purchaseDate, installmentsCount);

    const payload = {
      purchaseDate,
      totalAmount: updatePurchaseDto.totalAmount ?? currentPurchase.totalAmount,
      installmentsCount,
      installmentsEndDate,
      dueDate: updatePurchaseDto.dueDate ? new Date(updatePurchaseDto.dueDate) : currentPurchase.dueDate,
      tagIds: updatePurchaseDto.tagIds ?? currentPurchase.tagIds,
    };

    const purchase = await this.purchaseRepository.updateByIdAndScope(purchaseId, scope, payload);
    if (!purchase) {
      this.logger.debug({
        module: PurchasesService.name,
        action: 'update',
        phase: 'failure',
        purchaseId,
        scope,
        reason: 'purchase_not_found_after_update',
      });
      throw new NotFoundException('Compra nao encontrada.');
    }

    this.logger.debug({
      module: PurchasesService.name,
      action: 'update',
      phase: 'success',
      purchaseId,
      scope,
    });

    return { purchase };
  }

  async remove(purchaseId: string, requestUser: RequestUser) {
    const scope = this.buildScope(requestUser);
    this.logger.debug({
      module: PurchasesService.name,
      action: 'remove',
      phase: 'start',
      purchaseId,
      scope,
    });

    const deleted = await this.purchaseRepository.deleteByIdAndScope(purchaseId, scope);
    if (!deleted) {
      this.logger.debug({
        module: PurchasesService.name,
        action: 'remove',
        phase: 'failure',
        purchaseId,
        scope,
        reason: 'purchase_not_found',
      });
      throw new NotFoundException('Compra nao encontrada.');
    }

    this.logger.debug({
      module: PurchasesService.name,
      action: 'remove',
      phase: 'success',
      purchaseId,
      scope,
      deleted: true,
    });

    return { success: true };
  }

  private buildScope(requestUser: RequestUser): PurchaseScope {
    const baseScope: PurchaseScope = { account: requestUser.accountId };

    if (requestUser.role === 'admin') {
      return baseScope;
    }

    return {
      ...baseScope,
      user: requestUser.sub,
    };
  }

  private calculateInstallmentsEndDate(purchaseDate: Date, installmentsCount: number): Date {
    const installmentsEndDate = new Date(purchaseDate);
    installmentsEndDate.setMonth(installmentsEndDate.getMonth() + (installmentsCount));
    return installmentsEndDate;
  }
}