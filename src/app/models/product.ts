export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  category: string;
  stock: number;
  selectedImageIndex?: number;
  colors?: string[];
}