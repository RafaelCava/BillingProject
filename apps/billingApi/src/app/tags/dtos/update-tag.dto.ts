import { IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTagDto {
  @ApiPropertyOptional({ example: 'Transporte', description: 'Novo nome da tag' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: '#3B82F6', description: 'Nova cor hexadecimal da tag' })
  @IsOptional()
  @IsString()
  @IsHexColor()
  @MaxLength(40)
  color?: string;
}