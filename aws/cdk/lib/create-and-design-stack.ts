import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class CreateAndDesignStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
    });

    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const ordersTable = new dynamodb.Table(this, 'OrdersTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const productsLambda = new lambda.Function(this, 'ProductsLambda', {
      runtime: lambda.Runtime.DOTNET_8,
      handler: 'ProductsLambda::ProductsLambda.Function::FunctionHandler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/products/src/ProductsLambda'), {
        bundling: {
          image: lambda.Runtime.DOTNET_8.bundlingImage,
          command: ['bash', '-c', 'dotnet publish -c Release -o /asset-output'],
        },
      }),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const ordersLambda = new lambda.Function(this, 'OrdersLambda', {
      runtime: lambda.Runtime.DOTNET_8,
      handler: 'OrdersLambda::OrdersLambda.Function::FunctionHandler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/orders/src/OrdersLambda'), {
        bundling: {
          image: lambda.Runtime.DOTNET_8.bundlingImage,
          command: ['bash', '-c', 'dotnet publish -c Release -o /asset-output'],
        },
      }),
      environment: {
        ORDERS_TABLE_NAME: ordersTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    productsTable.grantReadData(productsLambda);
    ordersTable.grantReadWriteData(ordersLambda);

    const httpApi = new apigwv2.HttpApi(this, 'CreateAndDesignApi', {
      corsPreflight: {
        allowHeaders: ['content-type', 'authorization'],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ['*'],
      },
    });

    httpApi.addRoutes({
      path: '/products',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration('ProductsIntegration', productsLambda),
    });

    httpApi.addRoutes({
      path: '/orders',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration('OrdersIntegration', ordersLambda),
    });

    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.domainName}`,
    });

    new cdk.CfnOutput(this, 'ApiBaseUrl', {
      value: httpApi.apiEndpoint,
    });
  }
}
