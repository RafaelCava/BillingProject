import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { AppService } from './app.service';
import { DatabasesModule } from '@billing-management/databases';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [DatabasesModule, AuthModule],
  controllers: [UserController],
  providers: [AppService],
})
export class AppModule {}
