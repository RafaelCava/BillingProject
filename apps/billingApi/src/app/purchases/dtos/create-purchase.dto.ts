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

export class CreatePurchaseDto {
  @IsDateString()
  purchaseDate: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  installmentsCount?: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty({ each: true })
  tagIds?: string[];
}