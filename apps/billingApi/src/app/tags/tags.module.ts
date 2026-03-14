import { Module } from '@nestjs/common';
import { DatabasesModule } from '@billing-management/databases';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  imports: [DatabasesModule],
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {}