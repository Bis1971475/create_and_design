import argparse

import boto3


def main():
    parser = argparse.ArgumentParser(description="Seed products into DynamoDB table")
    parser.add_argument("--table", required=True, help="DynamoDB table name")
    parser.add_argument("--region", required=True, help="AWS region")
    args = parser.parse_args()

    dynamodb = boto3.resource("dynamodb", region_name=args.region)
    table = dynamodb.Table(args.table)

    products = [
        {
            "id": "1",
            "name": "Ramo de Rosas con Fresas",
            "description": "Ramo de 24 rosas con 6 fresas decoradas",
            "price": 650,
            "imageUrls": [
                "/flowers/strawberrysFlowers.jpeg",
                "/flowers/strawberrysFlowers2.jpeg",
                "/flowers/strawberrysFlowers3.jpeg",
            ],
            "category": "Rosas",
            "stock": 10,
        },
        {
            "id": "2",
            "name": "Caja de Rosas",
            "description": "Caja de 48 rosas en forma de corazon con fresas decoradas, con foto",
            "price": 900,
            "imageUrls": ["/flowers/cajaFlor.jpg", "/flowers/cajaFlor2.jpg", "/flowers/cajaFlor3.jpg"],
            "category": "Rosas",
            "stock": 5,
        },
        {
            "id": "3",
            "name": "Globo Burbuja",
            "description": "Globo personalizado de 2 colores y texto a eleccion",
            "price": 550,
            "imageUrls": [
                "/flowers/globoBurbuja.jpg",
                "/flowers/globoBurbuja2.jpg",
                "/flowers/globoBurbuja3.jpg",
            ],
            "category": "Globo",
            "stock": 7,
        },
    ]

    with table.batch_writer() as batch:
        for product in products:
            batch.put_item(Item=product)

    print(f"Seed complete. Inserted {len(products)} products in table {args.table}")


if __name__ == "__main__":
    main()
