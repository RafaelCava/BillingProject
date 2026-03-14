import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@empresa.com', description: 'Email do usuario para autenticacao' })
  @IsEmail()
  @MaxLength(100)
  email: string;

  @ApiProperty({ example: 'Senha@123', description: 'Senha do usuario' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}