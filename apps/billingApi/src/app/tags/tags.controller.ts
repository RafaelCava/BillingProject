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

type RequestUser = {
  sub: string;
  role: string;
  accountId: string;
};

@Controller('tags')
@UseGuards(JwtAuthGuard)
@Roles('admin', 'user')
export class TagsController {
  private readonly logger = new Logger(TagsController.name);

  constructor(private readonly tagsService: TagsService) {}

  @Post()
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