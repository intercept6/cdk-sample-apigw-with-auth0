import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import CdkSampleApigwWithAuth0 = require('../lib/cdk-sample-apigw-with-auth0-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CdkSampleApigwWithAuth0.CdkSampleApigwWithAuth0Stack(app, 'MyTestStack', {
        jwksUri: 'dummy',
        audience: 'dummy',
        issuer: 'dummy',
        env: {region: 'ap-northeast-1'}
    });
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
