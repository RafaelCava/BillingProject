import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListAccountsDto {
  @ApiPropertyOptional({ example: 'financeiro@empresa.com', description: 'Filtra contas por email' })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ example: '12.345.678/0001-90', description: 'Filtra contas por CNPJ' })
  @IsOptional()
  @IsString()
  @Length(14, 18)
  @Matches(/^[0-9./-]+$/, { message: 'cnpj deve conter apenas numeros e separadores validos' })
  cnpj?: string;
}