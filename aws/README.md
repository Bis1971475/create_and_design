# AWS Deployment Starter (Create And Design)

Este directorio contiene un starter para desplegar:

- Frontend Angular en `S3 + CloudFront`
- API en `API Gateway + Lambda (.NET 8 / C#)`
- Datos en `DynamoDB`

## Arquitectura recomendada

1. Frontend:
- Angular build (`dist/create-and-design/browser`) a bucket S3 privado
- CloudFront como CDN y endpoint publico

2. Backend:
- API Gateway HTTP API
- Lambda Node.js 20 para endpoints de productos/pedidos

3. Datos:
- Tabla DynamoDB para `products`
- Tabla DynamoDB para `orders`

## Estructura

- `cdk/`: infraestructura como codigo (AWS CDK, TypeScript)
- `lambda/products/src/ProductsLambda`: Lambda C# para listar productos
- `lambda/orders/src/OrdersLambda`: Lambda C# para crear pedidos

## Prerrequisitos

1. AWS CLI configurado (`aws configure`)
2. Node.js 20+
3. Docker Desktop activo (CDK usa bundling Docker para compilar Lambdas .NET)
4. AWS CDK instalado:

```bash
npm i -g aws-cdk
```

4. Bootstrap inicial de tu cuenta/región:

```bash
cd aws/cdk
npm install
npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
```

## Deploy

```bash
cd aws/cdk
npm run deploy
```

Al terminar, CDK imprime outputs con:
- URL de CloudFront
- URL base del API Gateway

## Deploy del frontend Angular

1. Generar build:

```bash
cd ../../
npm run build
```

2. Subir archivos al bucket del frontend (reemplaza `<BUCKET_NAME>`):

```bash
aws s3 sync dist/create-and-design/browser s3://<BUCKET_NAME> --delete
```

3. Invalidar cache de CloudFront (reemplaza `<DIST_ID>`):

```bash
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```

## Siguiente paso recomendado

Mover tus productos de `src/app/services/product.ts` a DynamoDB y consumir la API desde Angular con `HttpClient`.
