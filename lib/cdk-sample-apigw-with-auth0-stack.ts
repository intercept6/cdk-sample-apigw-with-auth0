import * as cdk from '@aws-cdk/core';
import {AuthorizationType, LambdaIntegration, RestApi, TokenAuthorizer} from '@aws-cdk/aws-apigateway';
import {Code, Function, LayerVersion, Runtime} from '@aws-cdk/aws-lambda';
import {NODE_LAMBDA_LAYER_DIR} from "./process/setup";

type CdkSampleApigwWithAuth0StackProps = cdk.StackProps & {
  jwksUri: string;
  audience: string;
  issuer: string;
}

export class CdkSampleApigwWithAuth0Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: CdkSampleApigwWithAuth0StackProps) {
    super(scope, id, props);

    const api = new RestApi(this, 'Api');

    const nodeModulesLayer = new LayerVersion(this, 'NodeModulesLayer', {
      code: Code.fromAsset(NODE_LAMBDA_LAYER_DIR),
      description: 'Node.js modules layer',
      compatibleRuntimes: [Runtime.NODEJS_12_X]
    });

    const fn = new Function(this, 'Fn', {
      code: Code.fromAsset('./src/lambda/handler/'),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_12_X,
      layers: [nodeModulesLayer]
    });

    const authFn = new Function(this, 'AuthorizerLambda', {
      code: Code.fromAsset('./src/lambda/handler/authorizer'),
      handler: 'handler-authorizer-auth.handler',
      runtime: Runtime.NODEJS_12_X,
      layers: [nodeModulesLayer],
      description: 'For custom authorizer',
      environment: {
        jwksUri: props.jwksUri,
        audience: props.audience,
        issuer: props.issuer,
      }
    });
    const auth = new TokenAuthorizer(this, 'Authorizer', {
      handler: authFn,
      validationRegex: '^Bearer [-0-9a-zA-Z\._]*$',
    });

    const lambdaIntegration = new LambdaIntegration(fn);
    api.root.addMethod('GET', lambdaIntegration, {
      authorizationType: AuthorizationType.CUSTOM,
      authorizer: auth
    });
  }
}
