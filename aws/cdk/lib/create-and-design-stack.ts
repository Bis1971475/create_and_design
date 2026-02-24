import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export class CreateAndDesignStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const productsLambdaAssetPath = path.join(__dirname, '../../lambda/products/dist/ProductsLambda');
    const ordersLambdaAssetPath = path.join(__dirname, '../../lambda/orders/dist/OrdersLambda');

    const ordersNotificationEmail = (
      this.node.tryGetContext('ordersNotificationEmail') ?? process.env.ORDERS_NOTIFICATION_EMAIL ?? ''
    ).toString().trim();
    const twilioAccountSid = (
      this.node.tryGetContext('twilioAccountSid') ?? process.env.TWILIO_ACCOUNT_SID ?? ''
    ).toString().trim();
    const twilioAuthToken = (
      this.node.tryGetContext('twilioAuthToken') ?? process.env.TWILIO_AUTH_TOKEN ?? ''
    ).toString().trim();
    const twilioWhatsAppFrom = (
      this.node.tryGetContext('twilioWhatsAppFrom') ?? process.env.TWILIO_WHATSAPP_FROM ?? ''
    ).toString().trim();
    const whatsappTo = (
      this.node.tryGetContext('whatsappTo') ?? process.env.WHATSAPP_TO ?? ''
    ).toString().trim();

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
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });

    const ordersNotificationsTopic = new sns.Topic(this, 'OrdersNotificationsTopic', {
      displayName: 'CreateAndDesign - Nuevos pedidos',
    });

    if (ordersNotificationEmail) {
      ordersNotificationsTopic.addSubscription(new subscriptions.EmailSubscription(ordersNotificationEmail));
    }

    const productsLambda = new lambda.Function(this, 'ProductsLambda', {
      runtime: lambda.Runtime.DOTNET_8,
      handler: 'ProductsLambda::ProductsLambda.Function::FunctionHandler',
      code: lambda.Code.fromAsset(productsLambdaAssetPath),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const ordersLambda = new lambda.Function(this, 'OrdersLambda', {
      runtime: lambda.Runtime.DOTNET_8,
      handler: 'OrdersLambda::OrdersLambda.Function::FunctionHandler',
      code: lambda.Code.fromAsset(ordersLambdaAssetPath),
      environment: {
        ORDERS_TABLE_NAME: ordersTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const ordersNotifierLambda = new lambda.Function(this, 'OrdersNotifierLambda', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/orders-notifier')),
      environment: {
        ORDERS_NOTIFICATIONS_TOPIC_ARN: ordersNotificationsTopic.topicArn,
        TWILIO_ACCOUNT_SID: twilioAccountSid,
        TWILIO_AUTH_TOKEN: twilioAuthToken,
        TWILIO_WHATSAPP_FROM: twilioWhatsAppFrom,
        WHATSAPP_TO: whatsappTo,
      },
      timeout: cdk.Duration.seconds(10),
    });

    productsTable.grantReadData(productsLambda);
    ordersTable.grantReadWriteData(ordersLambda);
    ordersNotificationsTopic.grantPublish(ordersNotifierLambda);

    ordersNotifierLambda.addEventSource(new lambdaEventSources.DynamoEventSource(ordersTable, {
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 5,
      retryAttempts: 2,
    }));

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

    new cdk.CfnOutput(this, 'OrdersNotificationsTopicArn', {
      value: ordersNotificationsTopic.topicArn,
    });

    new cdk.CfnOutput(this, 'OrdersNotificationEmail', {
      value: ordersNotificationEmail || 'NOT_CONFIGURED',
    });

    new cdk.CfnOutput(this, 'WhatsAppNotificationsTo', {
      value: whatsappTo || 'NOT_CONFIGURED',
    });
  }
}
