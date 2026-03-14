import { IsEmail, IsNotEmpty, IsString, Length, MaxLength, MinLength, Matches } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(14, 18)
  @Matches(/^[0-9./-]+$/, { message: 'cnpj deve conter apenas numeros e separadores validos' })
  cnpj: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  plan: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}