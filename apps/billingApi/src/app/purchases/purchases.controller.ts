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
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  ApiCookieAccessAuth,
  ApiErrorResponse,
  ApiForbiddenResponse,
  ApiSimpleSuccessResponse,
  ApiSuccessResponse,
  ApiUnauthorizedResponse,
  ApiValidationErrorResponse,
} from '../swagger/swagger.decorators';
import { PURCHASE_EXAMPLE, PURCHASE_UPDATED_EXAMPLE } from '../swagger/swagger.examples';

type RequestUser = {
  sub: string;
  role: string;
  accountId: string;
};

@ApiTags('Purchases')
@Controller('purchases')
@UseGuards(JwtAuthGuard)
@Roles('admin', 'user')
@ApiCookieAccessAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
export class PurchasesController {
  private readonly logger = new Logger(PurchasesController.name);

  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria uma compra',
    description: 'Cria uma compra vinculada ao accountId e userId do token autenticado.',
  })
  @ApiBody({ type: CreatePurchaseDto })
  @ApiSuccessResponse(201, 'Compra criada com sucesso.', { purchase: PURCHASE_EXAMPLE })
  @ApiValidationErrorResponse('Payload invalido.', {
    statusCode: 400,
    message: ['purchaseDate must be a valid ISO 8601 date string'],
    error: 'Bad Request',
  })
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
  @ApiOperation({
    summary: 'Lista compras',
    description: 'Lista compras do account do token. Para user comum, retorna apenas compras criadas por ele.',
  })
  @ApiSuccessResponse(200, 'Compras listadas com sucesso.', { purchases: [PURCHASE_EXAMPLE] })
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
  @ApiOperation({
    summary: 'Busca uma compra por id',
    description: 'Busca uma compra respeitando o escopo do token autenticado.',
  })
  @ApiParam({ name: 'id', example: '67c89db3344a8f2b8393d0c1', description: 'Id da compra' })
  @ApiSuccessResponse(200, 'Compra encontrada com sucesso.', { purchase: PURCHASE_EXAMPLE })
  @ApiErrorResponse(404, 'Compra nao encontrada.', {
    statusCode: 404,
    message: 'Compra nao encontrada.',
    error: 'Not Found',
  })
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
  @ApiOperation({
    summary: 'Atualiza uma compra',
    description: 'Atualiza os dados de uma compra respeitando o escopo do token autenticado.',
  })
  @ApiParam({ name: 'id', example: '67c89db3344a8f2b8393d0c1', description: 'Id da compra' })
  @ApiBody({ type: UpdatePurchaseDto })
  @ApiSuccessResponse(200, 'Compra atualizada com sucesso.', { purchase: PURCHASE_UPDATED_EXAMPLE })
  @ApiValidationErrorResponse('Payload invalido.', {
    statusCode: 400,
    message: ['totalAmount must not be less than 0'],
    error: 'Bad Request',
  })
  @ApiErrorResponse(404, 'Compra nao encontrada.', {
    statusCode: 404,
    message: 'Compra nao encontrada.',
    error: 'Not Found',
  })
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
  @ApiOperation({
    summary: 'Remove uma compra',
    description: 'Remove uma compra respeitando o escopo do token autenticado.',
  })
  @ApiParam({ name: 'id', example: '67c89db3344a8f2b8393d0c1', description: 'Id da compra' })
  @ApiSimpleSuccessResponse('Compra removida com sucesso.')
  @ApiErrorResponse(404, 'Compra nao encontrada.', {
    statusCode: 404,
    message: 'Compra nao encontrada.',
    error: 'Not Found',
  })
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