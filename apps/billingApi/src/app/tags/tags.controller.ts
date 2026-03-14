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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dtos/create-tag.dto';
import { UpdateTagDto } from './dtos/update-tag.dto';
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
import { TAG_EXAMPLE, TAG_UPDATED_EXAMPLE } from '../swagger/swagger.examples';

type RequestUser = {
  sub: string;
  role: string;
  accountId: string;
};

@ApiTags('Tags')
@Controller('tags')
@UseGuards(JwtAuthGuard)
@Roles('admin', 'user')
@ApiCookieAccessAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
export class TagsController {
  private readonly logger = new Logger(TagsController.name);

  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria uma tag',
    description: 'Cria uma tag vinculada ao accountId do token autenticado.',
  })
  @ApiBody({ type: CreateTagDto })
  @ApiSuccessResponse(201, 'Tag criada com sucesso.', { tag: TAG_EXAMPLE })
  @ApiValidationErrorResponse('Payload invalido.', {
    statusCode: 400,
    message: ['color must be a hexadecimal color'],
    error: 'Bad Request',
  })
  @ApiErrorResponse(409, 'Nome da tag ja cadastrado.', {
    statusCode: 409,
    message: 'Ja existe uma tag com este nome para esta conta.',
    error: 'Conflict',
  })
  async create(@Body() createTagDto: CreateTagDto, @Req() req: { user: RequestUser }) {
    this.logger.debug({
      module: TagsController.name,
      action: 'create',
      phase: 'start',
      accountId: req.user.accountId,
      userId: req.user.sub,
    });

    const result = await this.tagsService.create(createTagDto, req.user);

    this.logger.debug({
      module: TagsController.name,
      action: 'create',
      phase: 'success',
      accountId: req.user.accountId,
      userId: req.user.sub,
    });

    return result;
  }

  @Get()
  @ApiOperation({
    summary: 'Lista tags da conta',
    description: 'Lista todas as tags vinculadas ao accountId do token autenticado.',
  })
  @ApiSuccessResponse(200, 'Tags listadas com sucesso.', { tags: [TAG_EXAMPLE] })
  async findAll(@Req() req: { user: RequestUser }) {
    this.logger.debug({
      module: TagsController.name,
      action: 'findAll',
      phase: 'start',
      accountId: req.user.accountId,
      userId: req.user.sub,
      role: req.user.role,
    });

    const result = await this.tagsService.findAll(req.user);

    this.logger.debug({
      module: TagsController.name,
      action: 'findAll',
      phase: 'success',
      accountId: req.user.accountId,
      count: result.tags.length,
    });

    return result;
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca uma tag por id',
    description: 'Busca uma tag da conta autenticada pelo id informado.',
  })
  @ApiParam({ name: 'id', example: '67c89db3344a8f2b8393d0d1', description: 'Id da tag' })
  @ApiSuccessResponse(200, 'Tag encontrada com sucesso.', { tag: TAG_EXAMPLE })
  @ApiErrorResponse(404, 'Tag nao encontrada.', {
    statusCode: 404,
    message: 'Tag nao encontrada.',
    error: 'Not Found',
  })
  async findOne(@Param('id') tagId: string, @Req() req: { user: RequestUser }) {
    this.logger.debug({
      module: TagsController.name,
      action: 'findOne',
      phase: 'start',
      tagId,
      accountId: req.user.accountId,
      userId: req.user.sub,
    });

    const result = await this.tagsService.findOne(tagId, req.user);

    this.logger.debug({
      module: TagsController.name,
      action: 'findOne',
      phase: 'success',
      tagId,
      accountId: req.user.accountId,
    });

    return result;
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza uma tag',
    description: 'Atualiza uma tag da conta autenticada.',
  })
  @ApiParam({ name: 'id', example: '67c89db3344a8f2b8393d0d1', description: 'Id da tag' })
  @ApiBody({ type: UpdateTagDto })
  @ApiSuccessResponse(200, 'Tag atualizada com sucesso.', { tag: TAG_UPDATED_EXAMPLE })
  @ApiErrorResponse(404, 'Tag nao encontrada.', {
    statusCode: 404,
    message: 'Tag nao encontrada.',
    error: 'Not Found',
  })
  @ApiErrorResponse(409, 'Nome da tag ja cadastrado.', {
    statusCode: 409,
    message: 'Ja existe uma tag com este nome para esta conta.',
    error: 'Conflict',
  })
  async update(@Param('id') tagId: string, @Body() updateTagDto: UpdateTagDto, @Req() req: { user: RequestUser }) {
    this.logger.debug({
      module: TagsController.name,
      action: 'update',
      phase: 'start',
      tagId,
      accountId: req.user.accountId,
      userId: req.user.sub,
    });

    const result = await this.tagsService.update(tagId, updateTagDto, req.user);

    this.logger.debug({
      module: TagsController.name,
      action: 'update',
      phase: 'success',
      tagId,
      accountId: req.user.accountId,
    });

    return result;
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove uma tag',
    description: 'Remove uma tag da conta autenticada.',
  })
  @ApiParam({ name: 'id', example: '67c89db3344a8f2b8393d0d1', description: 'Id da tag' })
  @ApiSimpleSuccessResponse('Tag removida com sucesso.')
  @ApiErrorResponse(404, 'Tag nao encontrada.', {
    statusCode: 404,
    message: 'Tag nao encontrada.',
    error: 'Not Found',
  })
  async remove(@Param('id') tagId: string, @Req() req: { user: RequestUser }) {
    this.logger.debug({
      module: TagsController.name,
      action: 'remove',
      phase: 'start',
      tagId,
      accountId: req.user.accountId,
      userId: req.user.sub,
    });

    const result = await this.tagsService.remove(tagId, req.user);

    this.logger.debug({
      module: TagsController.name,
      action: 'remove',
      phase: 'success',
      tagId,
      accountId: req.user.accountId,
    });

    return result;
  }
}