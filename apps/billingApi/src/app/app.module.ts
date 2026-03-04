import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabasesModule } from '@billing-management/databases';

@Module({
  imports: [DatabasesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
