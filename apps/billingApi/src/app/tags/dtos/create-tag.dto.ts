import { IsHexColor, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: 'Alimentacao', description: 'Nome da tag' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: '#22C55E', description: 'Cor hexadecimal da tag' })
  @IsString()
  @IsNotEmpty()
  @IsHexColor()
  @MaxLength(40)
  color: string;
}