import * as cdk from '@aws-cdk/core';
import {AuthorizationType, LambdaIntegration, RestApi, TokenAuthorizer} from '@aws-cdk/aws-apigateway';
import {Code, Function, Runtime} from '@aws-cdk/aws-lambda';

export class CdkSampleApigwWithAuth0Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new RestApi(this, 'Api');

    const fn = new Function(this, 'Fn', {
      code: Code.fromAsset('./src/lambda/handler/'),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_12_X
    });

    const authFn = new Function(this, 'AuthorizerLambda', {
      code: Code.fromAsset('./src/lambda/handler/authorizer'),
      handler: 'auth.handler',
      runtime: Runtime.NODEJS_12_X
    });
    const auth = new TokenAuthorizer(this, 'Authorizer', {
      handler: authFn
    });

    const lambdaIntegration = new LambdaIntegration(fn);
    api.root.addMethod('GET', lambdaIntegration, {
      authorizationType: AuthorizationType.CUSTOM,
      authorizer: auth
    });
  }
}
