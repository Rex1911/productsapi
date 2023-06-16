import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNumber, IsPositive, IsString, ValidateNested } from 'class-validator';
import { VariantDto } from './variant.dto';
import { OmitType } from '@nestjs/swagger';

export class ProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested()
  @Type(() => VariantDto)
  variants: VariantDto[];
}

export class UpdateProductDto extends OmitType(ProductDto, ['variants']) {}
