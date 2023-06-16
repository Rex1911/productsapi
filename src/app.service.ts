import { HttpException, Injectable } from '@nestjs/common';
import { Product } from './schemas/product.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { ProductDto, UpdateProductDto } from './dtos/product.dto';
import { VariantDto } from './dtos/variant.dto';
import { Variant } from './schemas/variant.schema';
import { testData } from './test-data';

@Injectable()
export class AppService {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) {}

  async getAllProducts() {
    return this.productModel.find();
  }

  async getOneProduct(id: string) {
    let product = await this.productModel.findById(id);
    if (product === null) {
      throw new HttpException('Product not found', 404);
    }
    return product;
  }

  async createProduct(productDto: ProductDto): Promise<Product> {
    try {
      const product = new this.productModel(productDto);
      const savedProduct = await product.save();
      return savedProduct;
    } catch (err) {
      //Code 11000 is for duplicate key error
      if (err.code === 11000) {
        //Extacting the failed key so that it can be sent in error message
        const failedProperty = Object.keys(err.keyPattern)[0];

        //Extracting the failed value so that it can be sent in error message
        const failedValue = err.keyValue[failedProperty];

        throw new HttpException(`Trying to inset duplicate ${failedProperty}: ${failedValue}`, 400);
      } else if (err.name === 'ValidationError') {
        throw new HttpException(err.message, 400);
      }

      //Rethrow the original error if its not duplicate key error
      throw err;
    }
  }

  async createVariant(variantDto: VariantDto, productId: string): Promise<Variant> {
    const product = await this.productModel.findById(productId);
    //If product not found, we send back a 404 error
    if (product === null) {
      throw new HttpException('Product not found', 404);
    }

    const _id = new mongoose.Types.ObjectId();
    const newVariant = { _id, ...variantDto };
    product.variants.push(newVariant);
    try {
      const savedProduct = await product.save({ validateBeforeSave: true });
      return newVariant;
    } catch (err) {
      //Code 11000 is for duplicate key error
      if (err.code === 11000) {
        //Extacting the failed key so that it can be sent in error message
        const failedProperty = Object.keys(err.keyPattern)[0];

        //Extracting the failed value so that it can be sent in error message
        const failedValue = err.keyValue[failedProperty];

        throw new HttpException(`Trying to inset duplicate ${failedProperty}: ${failedValue}`, 400);
      } else if (err.name === 'ValidationError') {
        throw new HttpException(err.message, 400);
      }

      //Rethrow the original error if its not duplicate key error
      throw err;
    }
  }

  async updateProduct(productId: string, updateProductoDto: UpdateProductDto) {
    try {
      let updatedProduct = await this.productModel.findByIdAndUpdate(productId, updateProductoDto, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (updatedProduct === null) {
        throw new HttpException('Product not found', 404);
      }
      return updatedProduct;
    } catch (err) {
      //Code 11000 is for duplicate key error
      if (err.code === 11000) {
        //Extacting the failed key so that it can be sent in error message
        const failedProperty = Object.keys(err.keyPattern)[0];

        //Extracting the failed value so that it can be sent in error message
        const failedValue = err.keyValue[failedProperty];

        throw new HttpException(`There already is a product with ${failedProperty}: ${failedValue}`, 400);
      }

      //Rethrow the original error if its not duplicate key error
      throw err;
    }
  }

  async updateVariant(productId: string, variantId: string, variantDto: VariantDto) {
    let product = await this.productModel.findById(productId);
    if (product === null) {
      throw new HttpException('Product not found', 404);
    }

    let oldVariant: Variant | null = (product.variants as any).id(variantId);

    if (oldVariant === null) {
      throw new HttpException('Variant not found', 404);
    }

    oldVariant.SKU = variantDto.SKU;
    oldVariant.additional_cost = variantDto.additional_cost;
    oldVariant.name = variantDto.name;
    oldVariant.stock_count = variantDto.stock_count;

    try {
      const savedProudct = await product.save();
      return oldVariant;
    } catch (err) {
      //Code 11000 is for duplicate key error
      if (err.code === 11000) {
        //Extacting the failed key so that it can be sent in error message
        const failedProperty = Object.keys(err.keyPattern)[0];

        //Extracting the failed value so that it can be sent in error message
        const failedValue = err.keyValue[failedProperty];

        throw new HttpException(`There already is a ${failedProperty}: ${failedValue}`, 400);
      } else if (err.name === 'ValidationError') {
        throw new HttpException(err.message, 400);
      }

      //Rethrow the original error if its not duplicate key error
      throw err;
    }
  }

  async deleteProduct(productId: string) {
    let deletedDoc = await this.productModel.findByIdAndDelete(productId);
    if (deletedDoc === null) {
      throw new HttpException('Product not found', 404);
    }
    return deletedDoc;
  }

  async deleteVariant(productId: string, variantId: string) {
    const product = await this.productModel.findById(productId);
    if (product === null) {
      throw new HttpException('Product not found', 404);
    }

    //Type casting this to any since the .id() function does exists on variants, but since variants is of type Variants defined in schemas folder,
    // typescript thinks there is no .id() function.
    let variant: any | null = (product.variants as any).id(variantId);

    if (variant === null) {
      throw new HttpException('Variant not found', 404);
    }

    variant.deleteOne();

    await product.save();
    return variant;
  }

  async findByQueryParams(pName?: string, description?: string, vName?: string) {
    const query: Record<string, any> = {};
    if (pName) {
      query.name = new RegExp(pName, 'i');
    }
    if (description) {
      query.description = new RegExp(description, 'i');
    }
    if (vName) {
      query['variants.name'] = new RegExp(vName);
    }

    const foundProducts = await this.productModel.find(query);
    if (foundProducts.length === 0) {
      throw new HttpException('No Products found with selected search criteria', 404);
    }
    return foundProducts;
  }

  async resetDB() {
    await this.productModel.deleteMany({});
    await this.productModel.insertMany(testData);
    return testData;
  }
}
