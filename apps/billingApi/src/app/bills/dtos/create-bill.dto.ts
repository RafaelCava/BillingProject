import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsMongoId, IsNotEmpty, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateBillDto {
  @ApiProperty({ example: 'Fatura de Março', description: 'Nome da fatura' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;
  
  @ApiProperty({ example: 3, description: 'Quantidade de parcelas da compra. Quando omitido, assume 1' })
  @IsInt()
  @Min(1)
  installmentCount!: number;
  
  @ApiProperty({ example: '2026-03-10T00:00:00.000Z', description: 'Data em que a compra foi realizada' })
  @IsDateString()
  purchaseDate!: Date;
  
  @ApiProperty({ example: 100, description: 'Valor total da compra' })
  @IsInt()
  @Min(1)
  totalAmount!: number;

  @ApiProperty({ example: "", description: 'ID da conta associada à fatura' })
  @IsMongoId()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({ example: "", description: 'ID da purchase associada à fatura' })
  @IsMongoId()
  @IsNotEmpty()
  purchaseId!: string;
}