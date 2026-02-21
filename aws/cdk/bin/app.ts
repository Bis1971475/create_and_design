import * as cdk from 'aws-cdk-lib';
import { CreateAndDesignStack } from '../lib/create-and-design-stack';

const app = new cdk.App();

new CreateAndDesignStack(app, 'CreateAndDesignStack', {
  /* Puedes fijar cuenta/región así:
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
  */
});
