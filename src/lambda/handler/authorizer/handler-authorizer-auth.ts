import * as jwksClient from 'jwks-rsa';
import {CertSigningKey, RsaSigningKey } from "jwks-rsa";
import {decode, JsonWebTokenError, verify, TokenExpiredError} from 'jsonwebtoken';
import {promisify} from "util";


export async function handler(event: LambdaAuthorizerEvent): Promise<LambdaAuthorizerResponse> {
    try {
        console.log(event);
        const token = await getToken(event);
        const res = await getAuthentication(token);
        let policy;
        if (!res) {
            policy = await generatePolicy('', 'Deny', event.methodArn, {msg: 'failure'});
        } else {
            policy = await generatePolicy(res.sub, 'Allow', event.methodArn, {msg: 'success'});
        }
        console.log(policy);
        return policy;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

async function generatePolicy(principalId: string, effect: string, resource: string, context: { msg: string }) {
    return {
        principalId: principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource
                }
            ]
        },
        context: context
    };
}

async function getToken(event: LambdaAuthorizerEvent): Promise<string> {
    const authToken = event.authorizationToken.match(/^Bearer (.*)$/);
    if (!authToken || authToken.length < 2) {
        throw new Error('Expected "event.type" parameter to have value "TOKEN"');
    }
    const tokenString = event.authorizationToken;
    if (!tokenString) {
        throw new Error('Expected "event.authorizationToken" parameter to be set');
    }
    const match = tokenString.match(/^Bearer (.*)$/);
    if (!match || match.length < 2) {
        throw new Error(`Invalid Authorization token - ${tokenString} does not match "Bearer .*"`);
    }
    return match[1];
}

async function getAuthentication(token: string): Promise<ValidToken|null> {
    try {
        const decoded = decode(token, {complete: true});
        if (!decoded || typeof decoded === 'string') {
            throw new JsonWebTokenError('invalid token');
        }

        const client = jwksClient({jwksUri: process.env.jwksUri!});
        const getSigningKey = promisify(client.getSigningKey);
        const key = await getSigningKey(decoded.header.kid);
        const publicKey =
            (key as CertSigningKey).publicKey || (key as RsaSigningKey);
        const res = await verify(token, publicKey as string, {
            audience: process.env.audience,
            issuer: process.env.issuer
        });
        if (typeof res === "string") {
            throw new Error('token verify error')
        }
        return res as ValidToken
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            console.info(error);
            return null;
        } else if (error instanceof JsonWebTokenError) {
            console.info(error);
            return null;
        } else {
            throw error;
        }
    }
}

type ValidToken = {
    aud: string;
    azp: string;
    exp: number;
    gty: string;
    iat: number;
    iss: string;
    sub: string;
}

export type LambdaAuthorizerEvent = {
    type: 'TOKEN';
    methodArn: string;
    authorizationToken: string;
}

export type LambdaAuthorizerResponse = {
    principalId: string;
    policyDocument: {
        Version: string;
        Statement: Statement[];
    };
    context: object;
}

type Statement = {
    Action: string;
    Effect: string;
    Resource: string;
}
