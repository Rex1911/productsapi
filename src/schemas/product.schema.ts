import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Variant, VariantSchema } from './variant.schema';
import { ApiProperty } from '@nestjs/swagger';

@Schema()
export class Product {
  @ApiProperty()
  @Prop({ required: true, unique: true })
  name: string;

  @ApiProperty()
  @Prop({ required: true })
  description: string;

  @ApiProperty()
  @Prop({ required: true })
  price: number;

  @ApiProperty({ type: Variant, isArray: true })
  @Prop({
    required: true,
    type: [VariantSchema],
    /*We need to make sure that the SKU in the array are unique. The 'unique' index in MongoDB only works between 
      separate documents. But a array in the same document allows for a duplicate entry.
      @see - https://www.mongodb.com/docs/manual/core/index-multikey/#unique-multikey-index*/
    validate: {
      validator: (val: Variant[]) => {
        //Creating a basic hashmap to track which SKUs are already present in the array
        const foundMap = new Map();
        for (const variant of val) {
          if (foundMap.has(variant.SKU)) {
            return false;
          }
          foundMap.set(variant.SKU, true);
        }
        return true;
      },
      message: 'Possibly duplicate SKU detected in variants array',
    },
  })
  variants: Variant[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
