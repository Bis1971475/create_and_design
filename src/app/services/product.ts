import { Injectable } from '@angular/core';
import { Product } from '../models/product';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
    // Configurar cliente S3
  private  s3Client = new S3Client({
    region: 'us-east-1', // Tu región
    credentials: {
      accessKeyId: 'TU_ACCESS_KEY',
      secretAccessKey: 'TU_SECRET_KEY'
    }
  });

  private products: Product[] = [
    {
      id: '1',
      name: 'Ramo de Rosas con Fresas',
      description: 'Ramo de 24 rosas con 6 fresas decoradas',
      price: 650,
      imageUrls: [
        '/flowers/strawberrysFlowers.jpeg',
        '/flowers/strawberrysFlowers2.jpeg',
        '/flowers/strawberrysFlowers3.jpeg'
      ],
      category: 'Rosas',
      stock: 10
    },
    {
      id: '2',
      name: 'Caja de Rosas',
      description: 'Caja de 48 rosas en forma de corazon con fresas decoradas, con foto',
      price: 900,
      imageUrls: [
        '/flowers/cajaFlor.jpg',
        '/flowers/cajaFlor2.jpg',
        '/flowers/cajaFlor3.jpg'
      ],
      category: 'Rosas',
      stock: 5
    },
    {
      id: '3',
      name: 'Globo Burbuja',
      description: 'Globo personalizad de 2 colores y texto a eleccion',
      price: 550,
      imageUrls: [
        '/flowers/globoBurbuja.jpg',
        '/flowers/globoBurbuja2.jpg',
        '/flowers/globoBurbuja3.jpg'
      ],
      category: 'Globo',
      stock: 7
    },
    {
      id: '4',
      name: 'Ramo de 48 rosas',
      description: 'ramo de 48 rosas de 2 colores a eleccion',
      price: 550,
      imageUrls: [
        '/flowers/ramo48rosas.jpg'
      ],
      category: 'Rosas',
      stock: 7
    }
    ,
    {
      id: '5',
      name: 'Ramo de 24 rosas',
      description: 'ramo de 24 rosas',
      price: 450,
      imageUrls: [
        '/flowers/ramo.jpg'
      ],
      category: 'Rosas',
      stock: 7
    }
  ];

  getProducts(): Product[] {
    return this.products;
  }
  getProductById(productId: string): Product | undefined {
    return this.products.find((p) => p.id === productId);
  }
  // Subir archivo
  async  uploadFile(file: File, bucketName: string, key: string) {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: file.type
    });
    
    return await this.s3Client.send(command);
  }

  // Obtener URL firmada para descarga
  async  getDownloadUrl(bucketName: string, key: string) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    
    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

}