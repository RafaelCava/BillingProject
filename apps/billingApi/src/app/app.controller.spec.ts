import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [UserController],
      providers: [AppService],
    }).compile();
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const appController = app.get<UserController>(UserController);
      expect(appController.getData()).toEqual({message: 'Hello API'});
    });
  });
});
