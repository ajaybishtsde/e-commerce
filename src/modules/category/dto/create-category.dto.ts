import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  slug: string;

  @IsString()
  @IsOptional()
  imageUrl: string;

  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}
