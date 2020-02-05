#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkSampleApigwWithAuth0Stack } from '../lib/cdk-sample-apigw-with-auth0-stack';

const app = new cdk.App();
new CdkSampleApigwWithAuth0Stack(app, 'CdkSampleApigwWithAuth0Stack', {
    env: {
        region: 'ap-northeast-1'
    }
});
