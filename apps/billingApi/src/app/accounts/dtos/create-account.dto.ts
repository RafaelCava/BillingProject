import { IsEmail, IsNotEmpty, IsString, Length, MaxLength, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({ example: 'Empresa XPTO', description: 'Nome da conta/empresa' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'financeiro@empresa.com', description: 'Email principal da conta' })
  @IsEmail()
  @MaxLength(100)
  email: string;

  @ApiProperty({ example: '12.345.678/0001-90', description: 'CNPJ da conta' })
  @IsString()
  @IsNotEmpty()
  @Length(14, 18)
  @Matches(/^[0-9./-]+$/, { message: 'cnpj deve conter apenas numeros e separadores validos' })
  cnpj: string;

  @ApiProperty({ example: 'premium', description: 'Plano contratado' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  plan: string;

  @ApiProperty({ example: 'Senha@123', description: 'Senha do primeiro usuario administrador da conta' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}