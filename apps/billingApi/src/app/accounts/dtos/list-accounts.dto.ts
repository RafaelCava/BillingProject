import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class ListAccountsDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @Length(14, 18)
  @Matches(/^[0-9./-]+$/, { message: 'cnpj deve conter apenas numeros e separadores validos' })
  cnpj?: string;
}