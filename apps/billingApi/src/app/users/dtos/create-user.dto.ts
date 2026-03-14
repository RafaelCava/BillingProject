import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria Silva', description: 'Nome do usuario' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @ApiProperty({ example: 'maria@empresa.com', description: 'Email do usuario' })
  @IsEmail()
  @MaxLength(100)
  email!: string;

  @ApiProperty({ example: 'Senha@123', description: 'Senha do usuario' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @ApiPropertyOptional({ example: 'user', enum: ['admin', 'user'], description: 'Perfil do usuario' })
  @IsOptional()
  @IsEnum(['admin', 'user'])
  role?: 'admin' | 'user';
}