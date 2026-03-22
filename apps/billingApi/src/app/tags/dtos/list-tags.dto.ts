import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListTagsDto {
  @ApiPropertyOptional({ example: 1, description: 'Numero da pagina para paginacao (padrao: 1)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'Numero de itens por pagina (padrao: 20, maximo: 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    example: 'Ali',
    description: 'Filtra tags por nome (busca parcial, case-insensitive)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
