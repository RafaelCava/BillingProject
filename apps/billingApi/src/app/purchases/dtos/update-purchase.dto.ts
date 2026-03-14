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
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePurchaseDto {
  @ApiPropertyOptional({ example: '2026-03-10T00:00:00.000Z', description: 'Nova data da compra' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 320.5, description: 'Novo valor total da compra' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({ example: 5, description: 'Nova quantidade de parcelas' })
  @IsOptional()
  @IsInt()
  @Min(1)
  installmentsCount?: number;

  @ApiPropertyOptional({ example: '2026-04-10T00:00:00.000Z', description: 'Nova data de vencimento da compra' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    example: ['67c89db3344a8f2b8393d0a1'],
    description: 'Nova lista de ids de tags da compra',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty({ each: true })
  tagIds?: string[];
}