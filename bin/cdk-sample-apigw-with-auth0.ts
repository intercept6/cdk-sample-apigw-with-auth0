#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkSampleApigwWithAuth0Stack } from '../lib/cdk-sample-apigw-with-auth0-stack';
import { bundleNpm } from '../lib/process/setup';

// pre-process
bundleNpm();

const {
    jwksUri,
    audience,
    issuer
} = process.env as envs;


const app = new cdk.App();
new CdkSampleApigwWithAuth0Stack(app, 'CdkSampleApigwWithAuth0Stack', {
    jwksUri,
    audience,
    issuer,
    env: {
        region: 'ap-northeast-1'
    }
});

type envs = {
    jwksUri: string;
    audience: string;
    issuer: string
}