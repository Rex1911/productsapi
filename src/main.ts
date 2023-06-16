import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Product } from './schemas/product.schema';
import { Variant } from './schemas/variant.schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Setting up Swagger
  const config = new DocumentBuilder()
    .setTitle('Products API')
    .setDescription('A Simple Products API')
    .setVersion('1.0')
    .addTag('products')
    .build();
  const document = SwaggerModule.createDocument(app, config, { extraModels: [Product, Variant] });
  SwaggerModule.setup('api', app, document);

  //Setting up the schema validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //We set whitelist as true so that any undesireable properties will be stripped from the input
    }),
  );

  await app.listen(8080);
}
bootstrap();
