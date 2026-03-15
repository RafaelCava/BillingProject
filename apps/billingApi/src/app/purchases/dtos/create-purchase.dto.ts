import {
  IsArray,
  IsDateString,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePurchaseDto {
  @ApiProperty({ example: '2026-03-10T00:00:00.000Z', description: 'Data em que a compra foi realizada' })
  @IsDateString()
  purchaseDate!: string;

  @ApiProperty({ example: 249.9, description: 'Valor total da compra' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount!: number;

  @ApiPropertyOptional({ example: 3, description: 'Quantidade de parcelas da compra. Quando omitido, assume 1' })
  @IsOptional()
  @IsInt()
  @Min(1)
  installmentsCount?: number;

  @ApiPropertyOptional({
    example: ['67c89db3344a8f2b8393d0a1', '67c89db3344a8f2b8393d0a2'],
    description: 'Lista de ids das tags vinculadas a compra',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty({ each: true })
  tagIds?: string[];

  @ApiProperty({ example: 'Compra de software', description: 'Nome da compra' })
  @IsNotEmpty()
  name!: string;
}