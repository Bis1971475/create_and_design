import { Product } from '../models/product';

// Add your catalog products here to avoid querying DynamoDB on each load.
// If this array is empty, ProductService will fallback to the API endpoint.
export const LOCAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Ramo de Rosas con Fresas',
    description: 'Ramo de 12 rosas con 6 fresas decoradas',
    price: 400,
    imageUrls: [
      '/flowers/strawberrysFlowers.jpeg',
      '/flowers/strawberrysFlowers2.jpeg',
      '/flowers/strawberrysFlowers3.jpeg',
    ],
    category: 'Rosas',
    stock: 10,
  },
  {
    id: '2',
    name: 'Caja de Rosas',
    description: 'Caja de 48 rosas en forma de corazon con fresas decoradas, con foto',
    price: 800,
    imageUrls: ['/flowers/cajaFlor.jpg', '/flowers/cajaFlor2.jpg', '/flowers/cajaFlor3.jpg'],
    category: 'Rosas',
    stock: 5,
  },
  {
    id: '3',
    name: 'Globo Burbuja',
    description: 'Globo personalizado de 2 colores y texto a eleccion',
    price: 550,
    imageUrls: ['/flowers/globoBurbuja.jpg', '/flowers/globoBurbuja2.jpg', '/flowers/globoBurbuja3.jpg'],
    category: 'Globo',
    stock: 7,
  },
  {
    id: '4',
    name: 'Ramo de 48 rosas',
    description: 'ramo de 48 rosas de 2 colores a eleccion',
    price: 750,
    imageUrls: ['/flowers/ramo48rosas.jpg'],
    category: 'Rosas',
    stock: 7,
  },
  {
    id: '5',
    name: 'Ramo de 24 rosas',
    description: 'ramo de 24 rosas',
    price: 500,
    imageUrls: ['/flowers/ramo.jpg'],
    category: 'Rosas',
    stock: 7,
  },
];
