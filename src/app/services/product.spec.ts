import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ProductService } from './product';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return products from dynamodb', async () => {
    const sendSpy = vi.spyOn((service as any).dynamoClient, 'send').mockResolvedValue({
      Items: [
        {
          id: { S: '1' },
          name: { S: 'Ramo de Rosas con Fresas' },
          description: { S: 'Ramo de 24 rosas con 6 fresas decoradas' },
          price: { N: '650' },
          imageUrls: {
            L: [
              { S: 'https://tu-bucket-productos-imagenes.s3.us-east-2.amazonaws.com/flowers/strawberrysFlowers.jpeg' },
            ],
          },
          category: { S: 'Rosas' },
          stock: { N: '10' },
        },
      ],
    } as any);

    const products = await service.getProducts();

    expect(sendSpy).toHaveBeenCalled();
    expect(products.length).toBeGreaterThan(0);
    expect(products[0].id).toBe('1');
  });

  it('should return one product by id from dynamodb', async () => {
    const sendSpy = vi.spyOn((service as any).dynamoClient, 'send').mockResolvedValue({
      Item: {
        id: { S: '1' },
        name: { S: 'Ramo de Rosas con Fresas' },
        description: { S: 'Ramo de 24 rosas con 6 fresas decoradas' },
        price: { N: '650' },
        imageUrls: {
          L: [
            { S: 'https://tu-bucket-productos-imagenes.s3.us-east-2.amazonaws.com/flowers/strawberrysFlowers.jpeg' },
          ],
        },
        category: { S: 'Rosas' },
        stock: { N: '10' },
      },
    } as any);

    const product = await service.getProductById('1');

    expect(sendSpy).toHaveBeenCalled();
    expect(product?.id).toBe('1');
  });
});
