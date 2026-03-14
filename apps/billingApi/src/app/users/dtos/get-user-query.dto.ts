import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class GetUserQueryDto {
  @ApiProperty({
    example: 'maria@empresa.com',
    description: 'Email do usuario a ser consultado',
  })
  @IsEmail()
  @MaxLength(100)
  email!: string;
}