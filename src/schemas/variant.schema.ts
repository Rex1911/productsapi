import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema()
export class Variant {
  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty()
  @Prop({ required: true, unique: true })
  SKU: string;

  @ApiProperty()
  @Prop({ required: true })
  additional_cost: number;

  @ApiProperty()
  @Prop({ required: true })
  stock_count: number;
}

export const VariantSchema = SchemaFactory.createForClass(Variant);
