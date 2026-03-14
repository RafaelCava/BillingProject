import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dtos/create-purchase.dto';
import { UpdatePurchaseDto } from './dtos/update-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

type RequestUser = {
  sub: string;
  role: string;
  accountId: string;
};

@Controller('purchases')
@UseGuards(JwtAuthGuard)
@Roles('admin', 'user')
export class PurchasesController {
  private readonly logger = new Logger(PurchasesController.name);

  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  async create(@Body() createPurchaseDto: CreatePurchaseDto, @Req() req: { user: RequestUser }) {
    this.logger.debug({
      module: PurchasesController.name,
      action: 'create',
      phase: 'start',
      accountId: req.user.accountId,
      userId: req.user.sub,
    });

    const result = await this.purchasesService.create(createPurchaseDto, req.user);

    this.logger.debug({
      module: PurchasesController.name,
      action: 'create',
      phase: 'success',
      accountId: req.user.accountId,
      userId: req.user.sub,
    });

    return result;
  }

  @Get()
  async findAll(@Req() req: { user: RequestUser }) {
    this.logger.debug({
      module: PurchasesController.name,
      action: 'findAll',
      phase: 'start',
      accountId: req.user.accountId,
      userId: req.user.sub,
      role: req.user.role,
    });

    const result = await this.purchasesService.findAll(req.user);

    this.logger.debug({
      module: PurchasesController.name,
      action: 'findAll',
      phase: 'success',
      accountId: req.user.accountId,
      userId: req.user.sub,
      role: req.user.role,
      count: result.purchases.length,
    });

    return result;
  }

  @Get(':id')
  async findOne(@Param('id') purchaseId: string, @Req() req: { user: RequestUser }) {
    this.logger.debug({
      module: PurchasesController.name,
      action: 'findOne',
      phase: 'start',
      purchaseId,
      accountId: req.user.accountId,
      userId: req.user.sub,
      role: req.user.role,
    });

    const result = await this.purchasesService.findOne(purchaseId, req.user);

    this.logger.debug({
      module: PurchasesController.name,
      action: 'findOne',
      phase: 'success',
      purchaseId,
      accountId: req.user.accountId,
      userId: req.user.sub,
      role: req.user.role,
    });

    return result;
  }

  @Patch(':id')
  async update(
    @Param('id') purchaseId: string,
    @Body() updatePurchaseDto: UpdatePurchaseDto,
    @Req() req: { user: RequestUser },
  ) {
    this.logger.debug({
      module: PurchasesController.name,
      action: 'update',
      phase: 'start',
      purchaseId,
      accountId: req.user.accountId,
      userId: req.user.sub,
      role: req.user.role,
    });

    const result = await this.purchasesService.update(purchaseId, updatePurchaseDto, req.user);

    this.logger.debug({
      module: PurchasesController.name,
      action: 'update',
      phase: 'success',
      purchaseId,
      accountId: req.user.accountId,
      userId: req.user.sub,
      role: req.user.role,
    });

    return result;
  }

  @Delete(':id')
  async remove(@Param('id') purchaseId: string, @Req() req: { user: RequestUser }) {
    this.logger.debug({
      module: PurchasesController.name,
      action: 'remove',
      phase: 'start',
      purchaseId,
      accountId: req.user.accountId,
      userId: req.user.sub,
      role: req.user.role,
    });

    const result = await this.purchasesService.remove(purchaseId, req.user);

    this.logger.debug({
      module: PurchasesController.name,
      action: 'remove',
      phase: 'success',
      purchaseId,
      accountId: req.user.accountId,
      userId: req.user.sub,
      role: req.user.role,
    });

    return result;
  }
}