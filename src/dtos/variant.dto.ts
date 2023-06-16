import { IsNumber, IsString, Min } from 'class-validator';

export class VariantDto {
  @IsString()
  name: string;

  @IsString()
  SKU: string;

  @Min(0)
  @IsNumber()
  additional_cost: number;

  @Min(0)
  @IsNumber()
  stock_count: number;
}
