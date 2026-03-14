import { IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTagDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @IsHexColor()
  @MaxLength(40)
  color?: string;
}