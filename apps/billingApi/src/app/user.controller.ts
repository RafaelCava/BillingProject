import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post, Query, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { UserMongoRepository } from '@billing-management/databases';
import { CreateUserDto } from './dtos/createUserDto';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { hash } from 'bcrypt';

@Controller()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly appService: AppService,
    private readonly userRepository: UserMongoRepository
  ) {}

  @Get()
  getData() {
    this.logger.debug({ module: UserController.name, action: 'getData', phase: 'success' });
    return this.appService.getData();
  }

  @Get('/user')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'user')
  async getUser(@Query('email') email: string) {
    this.logger.debug({ module: UserController.name, action: 'getUser', phase: 'start', email });
    const user = await this.userRepository.findByEmail(email);
    this.logger.debug({
      module: UserController.name,
      action: 'getUser',
      phase: 'success',
      email,
      found: Boolean(user),
    });
    return user
  }

  @Post('/user')
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      this.logger.debug({
        module: UserController.name,
        action: 'createUser',
        phase: 'start',
        email: createUserDto.email,
        role: createUserDto.role ?? 'user',
      });
      const passwordHash = await hash(createUserDto.password, 10);
      const user = await this.userRepository.create({
        ...createUserDto,
        role: createUserDto.role ?? 'user',
        password: passwordHash,
      });
      this.logger.debug({
        module: UserController.name,
        action: 'createUser',
        phase: 'success',
        email: createUserDto.email,
        hasUser: Boolean(user),
      });
      return { user }
    } catch (error: unknown) {
      const errorDetails = error as { message?: string; stack?: string; code?: string | number };
      this.logger.error(
        {
          module: UserController.name,
          action: 'createUser',
          phase: 'failure',
          email: createUserDto.email,
          errorMessage: errorDetails?.message,
          errorCode: errorDetails?.code,
        },
        errorDetails?.stack,
      );
      throw new HttpException({message: errorDetails?.message, errorCode: errorDetails?.code}, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
