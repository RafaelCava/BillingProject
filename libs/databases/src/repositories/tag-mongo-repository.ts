import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tag } from '../schemas/tag';

@Injectable()
export class TagMongoRepository {
  private readonly logger = new Logger(TagMongoRepository.name);

  constructor(@InjectModel(Tag.name, 'billing') private tagModel: Model<Tag>) {}

  async create(tag: Partial<Tag>): Promise<Tag> {
    this.logger.debug({
      module: TagMongoRepository.name,
      action: 'create',
      phase: 'start',
      accountId: tag.account,
      name: tag.name,
    });

    const createdTag = new this.tagModel(tag);
    const savedTag = await createdTag.save();

    this.logger.debug({
      module: TagMongoRepository.name,
      action: 'create',
      phase: 'success',
      tagId: String((savedTag as unknown as { _id?: unknown })._id),
      accountId: savedTag.account,
      name: savedTag.name,
    });

    return savedTag;
  }

  async findByNameAndAccount(name: string, accountId: string): Promise<Tag | null> {
    this.logger.debug({
      module: TagMongoRepository.name,
      action: 'findByNameAndAccount',
      phase: 'start',
      accountId,
      name,
    });

    const tag = await this.tagModel.findOne({ name, account: accountId }).lean().exec();

    this.logger.debug({
      module: TagMongoRepository.name,
      action: 'findByNameAndAccount',
      phase: 'success',
      accountId,
      name,
      found: Boolean(tag),
    });

    return tag as Tag | null;
  }

  async findAllByAccount(accountId: string): Promise<Tag[]> {
    this.logger.debug({
      module: TagMongoRepository.name,
      action: 'findAllByAccount',
      phase: 'start',
      accountId,
    });

    const tags = await this.tagModel.find({ account: accountId }).sort({ createdAt: -1 }).lean().exec();

    this.logger.debug({
      module: TagMongoRepository.name,
      action: 'findAllByAccount',
      phase: 'success',
      accountId,
      count: tags.length,
    });

    return tags as Tag[];
  }

  async findByIdAndAccount(tagId: string, accountId: string): Promise<Tag | null> {
    this.logger.debug({
      module: TagMongoRepository.name,
      action: 'findByIdAndAccount',
      phase: 'start',
      tagId,
      accountId,
    });

    const tag = await this.tagModel.findOne({ _id: tagId, account: accountId }).lean().exec();

    this.logger.debug({
      module: TagMongoRepository.name,
      action: 'findByIdAndAccount',
      phase: 'success',
      tagId,
      accountId,
      found: Boolean(tag),
    });

    return tag as Tag | null;
  }

  async updateByIdAndAccount(tagId: string, accountId: string, payload: Partial<Tag>): Promise<Tag | null> {
    this.logger.debug({
      module: TagMongoRepository.name,
      action: 'updateByIdAndAccount',
      phase: 'start',
      tagId,
      accountId,
    });

    const tag = await this.tagModel
      .findOneAndUpdate({ _id: tagId, account: accountId }, { $set: payload }, { new: true })
      .lean()
      .exec();

    this.logger.debug({
      module: TagMongoRepository.name,
      action: 'updateByIdAndAccount',
      phase: 'success',
      tagId,
      accountId,
      found: Boolean(tag),
    });

    return tag as Tag | null;
  }

  async deleteByIdAndAccount(tagId: string, accountId: string): Promise<boolean> {
    this.logger.debug({
      module: TagMongoRepository.name,
      action: 'deleteByIdAndAccount',
      phase: 'start',
      tagId,
      accountId,
    });

    const result = await this.tagModel.deleteOne({ _id: tagId, account: accountId }).exec();

    this.logger.debug({
      module: TagMongoRepository.name,
      action: 'deleteByIdAndAccount',
      phase: 'success',
      tagId,
      accountId,
      deleted: result.deletedCount > 0,
    });

    return result.deletedCount > 0;
  }
}