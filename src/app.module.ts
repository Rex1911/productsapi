import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]), MongooseModule.forRoot(process.env.MONGO_URI!)],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
