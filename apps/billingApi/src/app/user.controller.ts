import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post, Query, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { UserMongoRepository } from '@billing-management/databases';
import { CreateUserDto } from './dtos/createUserDto';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { hash } from 'bcrypt';

@Controller()
export class UserController {
  constructor(
    private readonly appService: AppService,
    private readonly userRepository: UserMongoRepository
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('/user')
  @UseGuards(JwtAuthGuard)
  async getUser(@Query('email') email: string) {
    const user = await this.userRepository.findByEmail(email);
    Logger.debug({function: 'getUser', input: email, output: user}, 'UserController');
    return user
  }

  @Post('/user')
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      const passwordHash = await hash(createUserDto.password, 10);
      const user = await this.userRepository.create({
        ...createUserDto,
        password: passwordHash,
      } as any);
      Logger.debug({function: 'createUser', input: createUserDto, output: user}, 'UserController');
      return { user }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      Logger.error({function: 'createUser', message: error?.message, stack: error?.stack}, 'UserController');
      throw new HttpException({message: error?.message, errorCode: error?.code}, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
