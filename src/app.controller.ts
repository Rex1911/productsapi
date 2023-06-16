import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { Product } from './schemas/product.schema';
import { ProductDto, UpdateProductDto } from './dtos/product.dto';
import { VariantDto } from './dtos/variant.dto';
import { Variant } from './schemas/variant.schema';
import { ParamsOnlyId, ParamsPidVid, QueryDto } from './dtos/queryparams.dto';
import { ApiNotFoundResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   *  Search a product by name, description or variant. You can pass all of these together aswell, and the search fields do not have to be exact. For eg, you search for product_name=pixel and it would return all the products which have pixel in their name
   */
  @Get('/search')
  async findByQueryParams(@Query() queries: QueryDto) {
    return this.appService.findByQueryParams(queries.product_name, queries.description, queries.variant_name);
  }

  /**
   * This endpoint lists down all the products in the database
   */
  @Get('/products')
  getAllProducts(): Promise<Product[]> {
    return this.appService.getAllProducts();
  }

  /**
   * Fetch a single product using its ID
   */
  @Get('/products/:id')
  getOneProduct(@Param() params: ParamsOnlyId): Promise<Product> {
    return this.appService.getOneProduct(params.id!);
  }

  /**
   * Create a product
   */
  @Post('/products')
  createProduct(@Body() product: ProductDto): Promise<Product> {
    return this.appService.createProduct(product);
  }

  /**
   * Create a variant in the Product whos id is passed
   */
  @Post('/products/:id/variant')
  createVariant(@Body() variant: VariantDto, @Param() params: ParamsOnlyId): Promise<Variant> {
    return this.appService.createVariant(variant, params.id!);
  }

  /**
   * Update the products whose id is passed
   */
  @Put('/products/:id')
  updateProduct(@Param() params: ParamsOnlyId, @Body() updateProductDto: UpdateProductDto): Promise<Product> {
    return this.appService.updateProduct(params.id!, updateProductDto);
  }

  /**
   * Update a variant depending on the passed Product id (pid) and Variant id (vid)
   */
  @Put('/products/:pid/variant/:vid')
  updateVariant(@Param() params: ParamsPidVid, @Body() variantDto: VariantDto): Promise<Variant> {
    return this.appService.updateVariant(params.pid!, params.vid!, variantDto);
  }

  /**
   * Delete a product by its product id
   */
  @Delete('/products/:id')
  deleteProduct(@Param() params: ParamsOnlyId): Promise<Product> {
    return this.appService.deleteProduct(params.id!);
  }

  /**
   * Delete a variant inside a product by their product IDs
   */
  @Delete('/products/:pid/variant/:vid')
  deleteVariant(@Param() params: ParamsPidVid): Promise<Variant> {
    return this.appService.deleteVariant(params.pid!, params.vid!);
  }

  /**
   * Reset the database by filling static dummy data
   */
  @Get('/resetdb')
  resetDb() {
    return this.appService.resetDB();
  }
}
