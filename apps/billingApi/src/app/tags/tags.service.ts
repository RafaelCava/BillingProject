import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TagMongoRepository } from '@billing-management/databases';
import { CreateTagDto } from './dtos/create-tag.dto';
import { UpdateTagDto } from './dtos/update-tag.dto';

type RequestUser = {
  sub: string;
  role: string;
  accountId: string;
};

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(private readonly tagRepository: TagMongoRepository) {}

  async create(createTagDto: CreateTagDto, requestUser: RequestUser) {
    this.logger.debug({
      module: TagsService.name,
      action: 'create',
      phase: 'start',
      accountId: requestUser.accountId,
      name: createTagDto.name,
    });

    const existingTag = await this.tagRepository.findByNameAndAccount(createTagDto.name, requestUser.accountId);
    if (existingTag) {
      this.logger.debug({
        module: TagsService.name,
        action: 'create',
        phase: 'failure',
        accountId: requestUser.accountId,
        name: createTagDto.name,
        reason: 'tag_name_already_exists',
      });
      throw new ConflictException('Ja existe uma tag com este nome para esta conta.');
    }

    const tag = await this.tagRepository.create({
      account: requestUser.accountId,
      name: createTagDto.name,
      color: createTagDto.color,
    });

    this.logger.debug({
      module: TagsService.name,
      action: 'create',
      phase: 'success',
      accountId: requestUser.accountId,
      tagId: String((tag as unknown as { _id?: unknown })._id),
    });

    return { tag };
  }

  async findAll(requestUser: RequestUser) {
    this.logger.debug({
      module: TagsService.name,
      action: 'findAll',
      phase: 'start',
      accountId: requestUser.accountId,
      userId: requestUser.sub,
      role: requestUser.role,
    });

    const tags = await this.tagRepository.findAllByAccount(requestUser.accountId);

    this.logger.debug({
      module: TagsService.name,
      action: 'findAll',
      phase: 'success',
      accountId: requestUser.accountId,
      count: tags.length,
    });

    return { tags };
  }

  async findOne(tagId: string, requestUser: RequestUser) {
    this.logger.debug({
      module: TagsService.name,
      action: 'findOne',
      phase: 'start',
      tagId,
      accountId: requestUser.accountId,
    });

    const tag = await this.tagRepository.findByIdAndAccount(tagId, requestUser.accountId);
    if (!tag) {
      this.logger.debug({
        module: TagsService.name,
        action: 'findOne',
        phase: 'failure',
        tagId,
        accountId: requestUser.accountId,
        reason: 'tag_not_found',
      });
      throw new NotFoundException('Tag nao encontrada.');
    }

    this.logger.debug({
      module: TagsService.name,
      action: 'findOne',
      phase: 'success',
      tagId,
      accountId: requestUser.accountId,
    });

    return { tag };
  }

  async update(tagId: string, updateTagDto: UpdateTagDto, requestUser: RequestUser) {
    this.logger.debug({
      module: TagsService.name,
      action: 'update',
      phase: 'start',
      tagId,
      accountId: requestUser.accountId,
    });

    const currentTag = await this.tagRepository.findByIdAndAccount(tagId, requestUser.accountId);
    if (!currentTag) {
      this.logger.debug({
        module: TagsService.name,
        action: 'update',
        phase: 'failure',
        tagId,
        accountId: requestUser.accountId,
        reason: 'tag_not_found',
      });
      throw new NotFoundException('Tag nao encontrada.');
    }

    if (updateTagDto.name && updateTagDto.name !== currentTag.name) {
      const existingTag = await this.tagRepository.findByNameAndAccount(updateTagDto.name, requestUser.accountId);
      if (existingTag) {
        this.logger.debug({
          module: TagsService.name,
          action: 'update',
          phase: 'failure',
          tagId,
          accountId: requestUser.accountId,
          reason: 'tag_name_already_exists',
          name: updateTagDto.name,
        });
        throw new ConflictException('Ja existe uma tag com este nome para esta conta.');
      }
    }

    const tag = await this.tagRepository.updateByIdAndAccount(tagId, requestUser.accountId, {
      name: updateTagDto.name ?? currentTag.name,
      color: updateTagDto.color ?? currentTag.color,
    });

    if (!tag) {
      this.logger.debug({
        module: TagsService.name,
        action: 'update',
        phase: 'failure',
        tagId,
        accountId: requestUser.accountId,
        reason: 'tag_not_found_after_update',
      });
      throw new NotFoundException('Tag nao encontrada.');
    }

    this.logger.debug({
      module: TagsService.name,
      action: 'update',
      phase: 'success',
      tagId,
      accountId: requestUser.accountId,
    });

    return { tag };
  }

  async remove(tagId: string, requestUser: RequestUser) {
    this.logger.debug({
      module: TagsService.name,
      action: 'remove',
      phase: 'start',
      tagId,
      accountId: requestUser.accountId,
    });

    const deleted = await this.tagRepository.deleteByIdAndAccount(tagId, requestUser.accountId);
    if (!deleted) {
      this.logger.debug({
        module: TagsService.name,
        action: 'remove',
        phase: 'failure',
        tagId,
        accountId: requestUser.accountId,
        reason: 'tag_not_found',
      });
      throw new NotFoundException('Tag nao encontrada.');
    }

    this.logger.debug({
      module: TagsService.name,
      action: 'remove',
      phase: 'success',
      tagId,
      accountId: requestUser.accountId,
      deleted: true,
    });

    return { success: true };
  }
}