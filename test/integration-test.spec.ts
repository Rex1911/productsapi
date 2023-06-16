import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Product } from '../src/schemas/product.schema';
import mongoose, { Model, mongo } from 'mongoose';
import { Variant } from 'src/schemas/variant.schema';
import { testData } from '../src/test-data';

describe('Products Test Suit', () => {
  let app: INestApplication;
  let produtModel: Model<Product>;
  const initalTestDataForAllTests = testData;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    produtModel = moduleFixture.get('ProductModel');
    await produtModel.deleteMany({});
    await produtModel.insertMany(initalTestDataForAllTests);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET Method Tests', () => {
    it('GET /products should display all products', async () => {
      let response = await request(app.getHttpServer()).get('/products');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(initalTestDataForAllTests.length);
    });

    it('GET /products/:id should successfully display the product with passed id', async () => {
      //Need to get all products first to atlest get the _id of one of the products
      let response = await request(app.getHttpServer()).get('/products');
      let randomProduct = response.body[0];

      let responseIndividualProduct = await request(app.getHttpServer()).get(`/products/${randomProduct._id}`);
      expect(responseIndividualProduct.status).toBe(200);
      expect(responseIndividualProduct.body._id).toBe(randomProduct._id);
      expect(responseIndividualProduct.body.name).toBe(randomProduct.name);
      expect(responseIndividualProduct.body.description).toBe(randomProduct.description);
    });

    it('GET /products/:id for non existing product should give 404 status code', async () => {
      //This generates random _id for MongoDB. In a very very very rare case, it may actually generate a id which already exists in database.
      //But the possibility is so less that we might aswell use this to generate some random id
      const randomProductId = new mongoose.Types.ObjectId().toString();
      let response = await request(app.getHttpServer()).get(`/products/${randomProductId}`);
      expect(response.status).toBe(404);
    });
  });

  describe('POST Method Tests', () => {
    it('POST /products should successfuly create a product and return back the created product', async () => {
      const productToInsert = {
        name: 'Random New Phone',
        description: 'Random',
        price: 799.99,
        variants: [
          {
            name: '128GB',
            SKU: 'RNP-128GB-01',
            additional_cost: 0,
            stock_count: 60,
          },
        ],
      };
      let insertResponse = await request(app.getHttpServer()).post('/products').send(productToInsert);
      const addedProductId = insertResponse.body._id;

      //We fetch the just added product to check if everthing was inserted correctly
      let getResponse = await request(app.getHttpServer()).get(`/products/${addedProductId}`);

      //Check if all fields match with productToInsert object
      expect(insertResponse.status).toBe(201);
      expect(getResponse.body._id).toBe(insertResponse.body._id);
      expect(getResponse.body.name).toBe(productToInsert.name);
      expect(getResponse.body.description).toBe(productToInsert.description);
      expect(getResponse.body.price).toBe(productToInsert.price);
      expect(getResponse.body.variants.length).toBe(productToInsert.variants.length);
    });

    it('POST /products with duplicate product.name should error out with 400', async () => {
      //Getting a name of a product which already should exists in database
      const duplicateProductName = initalTestDataForAllTests[0].name;
      const product = {
        name: duplicateProductName,
        description: 'A flagship Google smartphone',
        price: 799.99,
        variants: [
          {
            name: '128GB',
            SKU: 'GP10-128GB-01',
            additional_cost: 0,
            stock_count: 60,
          },
        ],
      };
      let response = await request(app.getHttpServer()).post('/products').send(product);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(`Trying to inset duplicate name: ${duplicateProductName}`);
    });

    it('POST /products with duplicate SKU id in their array should error out with status 400 ', async () => {
      const product = {
        name: 'Google Pixel 6',
        description: 'A flagship Google smartphone',
        price: 799.99,
        variants: [
          {
            name: '128GB',
            SKU: 'GP6-128GB-01',
            additional_cost: 0,
            stock_count: 60,
          },
          {
            name: '128GB',
            SKU: 'GP6-128GB-01',
            additional_cost: 0,
            stock_count: 60,
          },
        ],
      };
      let response = await request(app.getHttpServer()).post('/products').send(product);
      expect(response.status).toBe(400);
    });

    it('POST /products where SKU is already used in some other document should error with 400 ', async () => {
      const duplicateSKU = initalTestDataForAllTests[0].variants[0].SKU;
      const product = {
        name: 'Google Pixel 6',
        description: 'A flagship Google smartphone',
        price: 799.99,
        variants: [
          {
            name: '128GB',
            SKU: duplicateSKU,
            additional_cost: 0,
            stock_count: 60,
          },
        ],
      };
      let response = await request(app.getHttpServer()).post('/products').send(product);
      expect(response.status).toBe(400);
    });

    //=========CREATE VARIANT TESTS=================
    it('POST /products/:id/variant should create a variant and respond with 201', async () => {
      //First we fetch all products in db so that we can get the _id of any product to add a varitant to
      const allProductsInDb = (await request(app.getHttpServer()).get('/products')).body;
      const productId = allProductsInDb[0]._id;

      const varitantToInsert = {
        name: '1000GB',
        SKU: 'IP13-1000GB-01',
        additional_cost: 1000,
        stock_count: 1,
      };

      const createdVariant = await request(app.getHttpServer()).post(`/products/${productId}/variant`).send(varitantToInsert);
      expect(createdVariant.status).toBe(201);

      //We retrive that product now and check if variant is added successfully
      const singleProduct = (await request(app.getHttpServer()).get(`/products/${productId}`)).body;
      const foundProduct: Variant = singleProduct.variants.find((variant) => variant._id === createdVariant.body._id);
      expect(foundProduct).toBeTruthy();
      expect(foundProduct.SKU).toBe(varitantToInsert.SKU);
      expect(foundProduct.additional_cost).toBe(varitantToInsert.additional_cost);
      expect(foundProduct.name).toBe(varitantToInsert.name);
      expect(foundProduct.stock_count).toBe(varitantToInsert.stock_count);
    });

    it('POST /products/:id/variant should repond with status 400 when trying to create a variant with a SKU which already exists in the same product', async () => {
      //First we fetch all products in db so that we can get the _id SKU of any product and variant
      const allProductsInDb = (await request(app.getHttpServer()).get('/products')).body;
      const productId = allProductsInDb[0]._id;
      const alreadyExistingSKU = allProductsInDb[0].variants[0].SKU;

      const varitantToInsert = {
        name: '1000GB',
        SKU: alreadyExistingSKU,
        additional_cost: 1000,
        stock_count: 1,
      };

      const createdVariant = await request(app.getHttpServer()).post(`/products/${productId}/variant`).send(varitantToInsert);
      expect(createdVariant.status).toBe(400);
    });

    it('POST /products/:id/variant should repond with status 400 when trying to create a variant with a SKU which already exists in another product', async () => {
      //First we fetch all products in db so that we can get the _id SKU of any product and variant
      const allProductsInDb = (await request(app.getHttpServer()).get('/products')).body;
      const productId = allProductsInDb[0]._id;

      //We get the SKU of a different product than the one we are trying to create a variant for in this test case
      const alreadyExistingSKU = allProductsInDb[1].variants[0].SKU;

      const varitantToInsert = {
        name: '1000GB',
        SKU: alreadyExistingSKU,
        additional_cost: 1000,
        stock_count: 1,
      };

      const createdVariant = await request(app.getHttpServer()).post(`/products/${productId}/variant`).send(varitantToInsert);
      expect(createdVariant.status).toBe(400);
    });

    it('POST /products/:id/variant should give 404 when non existing product id is passed', async () => {
      const randomId = new mongoose.Types.ObjectId();
      const response = await request(app.getHttpServer()).put(`/products/${randomId}/variant`);
      expect(response.status).toBe(404);
    });
  });

  describe('PUT Method Tests', () => {
    //=========UPDATE PRODUCT TESTS=================
    it('PUT /products/:id should update the specified product with the passed data', async () => {
      //First we fetch all products in db so that we can get the _id of any product which we want to updatee
      const allProductsInDb = (await request(app.getHttpServer()).get('/products')).body;
      const originalProduct = allProductsInDb[0];

      const newProductData = {
        name: 'New Product name',
        description: 'New Description',
        price: 1000,
      };

      const response = await request(app.getHttpServer()).put(`/products/${originalProduct._id}`).send(newProductData);

      //Fetching data for the updated product
      let updatedOgProduct = (await request(app.getHttpServer()).get(`/products/${originalProduct._id}`)).body;

      expect(response.status).toBe(200);
      expect(updatedOgProduct._id).toBe(originalProduct._id); //Making sure ID is not changed
      expect(updatedOgProduct.name).toBe(newProductData.name);
      expect(updatedOgProduct.description).toBe(newProductData.description);
      expect(updatedOgProduct.price).toBe(newProductData.price);
    });

    it('PUT /products/:id should give 400 error when product.name is updated with a duplicate name', async () => {
      //First we fetch all products in db so that we can get the _id of any product which we want to updatee
      const allProductsInDb = (await request(app.getHttpServer()).get('/products')).body;
      const productOne = allProductsInDb[0];
      const productTwo = allProductsInDb[1];

      //We will update product 1 with the name of product 2. This will create a conflict in their name
      productOne.name = productTwo.name;

      const response = await request(app.getHttpServer()).put(`/products/${productOne._id}`).send(productOne);
      expect(response.status).toBe(400);
    });

    it('PUT /products/:id should give 404 when non existing id is passed', async () => {
      const randomId = new mongoose.Types.ObjectId();
      const response = await request(app.getHttpServer()).put(`/products/${randomId}`);
      expect(response.status).toBe(404);
    });

    //=========UPDATE VARIANT TESTS=================
    it('PUT /products/:pid/variant/:vid should update the specified variant of the correct product with the passed data', async () => {
      //First we fetch all products in db so that we can get the _id of any product and variant which we want to updatee
      const allProductsInDb = (await request(app.getHttpServer()).get('/products')).body;
      const originalProduct = allProductsInDb[0];
      const originalVariant = originalProduct.variants[0];

      const newVariant = {
        name: 'New Variant name',
        SKU: 'NEWSKU-000-000',
        additional_cost: 1000,
        stock_count: 100,
      };

      const response = await request(app.getHttpServer())
        .put(`/products/${originalProduct._id}/variant/${originalVariant._id}`)
        .send(newVariant);

      //Fetching data for the product whos variant is updated
      let updatedOgProduct = (await request(app.getHttpServer()).get(`/products/${originalProduct._id}`)).body;
      //Accessing the 0th variant since that what we modified
      let updatedVariant = updatedOgProduct.variants[0];

      expect(response.status).toBe(200);
      expect(updatedVariant._id).toBe(originalVariant._id); //Making sure ID is not changed
      expect(updatedVariant.name).toBe(newVariant.name);
      expect(updatedVariant.SKU).toBe(newVariant.SKU);
      expect(updatedVariant.additional_cost).toBe(newVariant.additional_cost);
      expect(updatedVariant.stock_count).toBe(newVariant.stock_count);
    });

    it('PUT /products/:pid/variant/:vid should give 400 error when trying to update SKU to a already existing SKU in the same product', async () => {
      //First we fetch all products in db so that we can get the _id of any product and variant which we want to updatee
      const allProductsInDb = (await request(app.getHttpServer()).get('/products')).body;
      const originalProduct = allProductsInDb[0];
      const variantOne = originalProduct.variants[0];
      const variantTwo = originalProduct.variants[1];

      //Replaing variantOne's SKU with variantTwo's SKU
      variantOne.SKU = variantTwo.SKU;

      //Updating variantOne
      const response = await request(app.getHttpServer())
        .put(`/products/${originalProduct._id}/variant/${variantOne._id}`)
        .send(variantOne);

      expect(response.status).toBe(400);
    });

    it('PUT /products/:pid/variant/:vid should give 400 error when trying to update SKU to a already existing SKU in the another product', async () => {
      //First we fetch all products in db so that we can get the _id of any product and variant which we want to updatee
      const allProductsInDb = (await request(app.getHttpServer()).get('/products')).body;
      const productOne = allProductsInDb[0];
      const productTwo = allProductsInDb[1];

      //Replaing productOne's SKU with productTwo's SKU
      productOne.variants[0].SKU = productTwo.variants[0].SKU;

      //Updating productOne's variant
      const response = await request(app.getHttpServer())
        .put(`/products/${productOne._id}/variant/${productOne.variants[0]._id}`)
        .send(productOne.variants[0]);

      expect(response.status).toBe(400);
    });

    it('PUT /products/:pid/variant/:vid should give 404 error when trying to update variant for nonexisting product', async () => {
      //First we fetch all products in db so that we can get the _id of any product and variant which we want to update
      const allProductsInDb = (await request(app.getHttpServer()).get('/products')).body;
      const randomProductId = new mongoose.Types.ObjectId();

      const newVariant = {
        name: 'New Variant name',
        SKU: 'NEWSKU-000-000',
        additional_cost: 1000,
        stock_count: 100,
      };

      const response = await request(app.getHttpServer())
        .put(`/products/${randomProductId._id}/variant/${allProductsInDb[0].variants[0]._id}`)
        .send(newVariant);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found');
    });

    it('PUT /products/:pid/variant/:vid should give 404 error when trying to update a non existing variant of a correct product', async () => {
      //First we fetch all products in db so that we can get the _id of any product and variant which we want to update
      const allProductsInDb = (await request(app.getHttpServer()).get('/products')).body;
      const randomVariantId = new mongoose.Types.ObjectId();

      const newVariant = {
        name: 'New Variant name',
        SKU: 'NEWSKU-000-000',
        additional_cost: 1000,
        stock_count: 100,
      };

      const response = await request(app.getHttpServer())
        .put(`/products/${allProductsInDb[0]._id}/variant/${randomVariantId}`)
        .send(newVariant);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Variant not found');
    });
  });

  describe('DELETE Method Tests', () => {
    it('DELETE /products/:id should delete the specified product', async () => {
      //First we fetch all products in db so that we can get the _id of any product
      const allProductsInDb = (await request(app.getHttpServer()).get('/products')).body;
      const productToDelete = allProductsInDb[0];

      const deleteResponse = await request(app.getHttpServer()).delete(`/products/${productToDelete._id}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.name).toBe(productToDelete.name);

      //Now if we try to GET that product, we should get 404
      const getResponse = await request(app.getHttpServer()).get(`/products/${productToDelete._id}`);
      expect(getResponse.status).toBe(404);
    });

    it('DELETE /products/:id should give 404 error when trying to delete a nonexisting product', async () => {
      const randomProductId = new mongoose.Types.ObjectId();
      const deleteResponse = await request(app.getHttpServer()).delete(`/products/${randomProductId}`);
      expect(deleteResponse.status).toBe(404);
    });

    it('DELETE /products/:pid/variant/:vid should delete the specified variant from the appropriate product', async () => {
      //First we fetch all products in db so that we can get the _id of any product
      const allProductsInDb = (await request(app.getHttpServer()).get('/products')).body;
      const productToDeleteVariantFor = allProductsInDb[0];
      const variantToDelete = productToDeleteVariantFor.variants[0];

      const deleteResponse = await request(app.getHttpServer()).delete(
        `/products/${productToDeleteVariantFor._id}/variant/${variantToDelete._id}`,
      );
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body._id).toBe(variantToDelete._id);

      //Now if we try to GET that product, the variant for it should be missing
      const getResponse = await request(app.getHttpServer()).get(`/products/${productToDeleteVariantFor._id}`);

      //Trying to find the variant in the variant array
      const found = getResponse.body.variants.find((variant) => variant._id === variantToDelete._id);
      expect(found).toBeFalsy();
    });

    it('DELETE /products/:pid/variant/:vid should give 404 error when trying to delete a nonexisting variant', async () => {
      //First we fetch all products in db so that we can get the _id of any product
      const allProductsInDb = (await request(app.getHttpServer()).get('/products')).body;
      const productToDeleteVariantFor = allProductsInDb[0];
      const randomVariantId = new mongoose.Types.ObjectId();

      const deleteResponse = await request(app.getHttpServer()).delete(
        `/products/${productToDeleteVariantFor._id}/variant/${randomVariantId._id}`,
      );
      expect(deleteResponse.status).toBe(404);
    });
  });

  describe('SEARCH route tests', () => {
    it('GET /search?product_name=pixel should return all phones which have pixel in their name', async () => {
      const response = await request(app.getHttpServer()).get('/search?product_name=pixel');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
    });

    it('GET /search?description=flagship should return all phones which have flagship in their description', async () => {
      const response = await request(app.getHttpServer()).get('/search?description=flagship');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(4);
    });

    it('GET /search?description=flagship&variant_name=512GB should return all phones which have flagship in their description and have a variant with name as 512GB', async () => {
      const response = await request(app.getHttpServer()).get('/search?description=flagship&variant_name=512GB');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);
    });
    it('GET /search?variant_name=1TB should return all phones which have 1TB variant', async () => {
      const response = await request(app.getHttpServer()).get('/search?variant_name=1TB');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
    });
  });
});
