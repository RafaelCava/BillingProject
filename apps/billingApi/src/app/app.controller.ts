import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { UserMongoRepository } from '@billing-management/databases';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userRepository: UserMongoRepository
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('/user')
  async getUser(@Query('email') email: string) {
    const user = await this.userRepository.findByEmail(email);
    console.log({user}, "controller")
    return user
  }

  @Post('/user')
  async createUser(@Body() createUserDto: any) {
    try {
      const user = await this.userRepository.create(createUserDto);
      return { user }
    } catch (error: any) {
      Logger.error({function: 'createUser', message: error?.message, stack: error?.stack}, 'AppController');
      throw new HttpException({message: error?.message, errorCode: error?.code}, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
