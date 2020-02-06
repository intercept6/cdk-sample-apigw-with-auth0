import {expect as expectCDK, haveResource} from '@aws-cdk/assert';
import {App, Stack} from "@aws-cdk/core";

import CdkSampleApigwWithAuth0 = require('../lib/cdk-sample-apigw-with-auth0-stack');

test('Resources', () => {
    const app = new App();
    // WHEN
    const stack = new CdkSampleApigwWithAuth0.CdkSampleApigwWithAuth0Stack(app, 'MyTestStack', {
        jwksUri: 'dummy',
        audience: 'dummy',
        issuer: 'dummy',
        env: {region: 'ap-northeast-1'}
    });
    // THEN
    expectCDK(stack).to(haveResource('AWS::ApiGateway::RestApi', {
        Name: 'Api'
    }));
    expectCDK(stack).to(haveResource('AWS::ApiGateway::Deployment', {}));
    expectCDK(stack).to(haveResource('AWS::ApiGateway::Stage', {
        StageName: 'prod'
    }));
    expectCDK(stack).to(haveResource('AWS::Lambda::LayerVersion', {
        CompatibleRuntimes: ['nodejs12.x'],
        Description: 'Node.js modules layer'
    }));
    expectCDK(stack).to(haveResource('AWS::Lambda::Function', {
        Handler: 'index.handler',
        Runtime: 'nodejs12.x'
    }));
    expectCDK(stack).to(haveResource('AWS::Lambda::Function', {
        Handler: 'handler-authorizer-auth.handler',
        Runtime: 'nodejs12.x',
        Description: 'For custom authorizer'
    }));
    expectCDK(stack).to(haveResource('AWS::ApiGateway::Authorizer', {
        IdentityValidationExpression: '^Bearer [-0-9a-zA-Z._]*$'
    }));
});
