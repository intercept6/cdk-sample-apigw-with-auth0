import * as jwksClient from 'jwks-rsa';
import { RsaSigningKey, SigningKey } from 'jwks-rsa';
import { CertSigningKey } from 'jwks-rsa';
import { LotteryApplicationError } from '../../lottery-application-error';

const ApiEndpoint = process.env.API_ENDPOINT!;
const Auth0Domain = process.env.AUTH0_DOMAIN!;
const TokenIssuer = `https://${Auth0Domain}/`;
const JwksUri = `https://${Auth0Domain}/.well-known/jwks.json`;

export class Auth0Client {
    public static async getSigningKey(kid: string): Promise<string> {
        const key: SigningKey = await Auth0Client.getSigningKeyPromise(
            kid,
        ).catch(e => {
            throw new Auth0ClientJwksRequestError(kid, e);
        });
        const signingKey =
            (key as CertSigningKey).publicKey ||
            (key as RsaSigningKey).rsaPublicKey;
        if (!signingKey) {
            throw new Auth0ClientKeyNotFoundError(
                kid,
                new Error(
                    `unable to find publicKey nor rsaPublicKey in ${key}`,
                ),
            );
        }
        return signingKey;
    }

    private static async getSigningKeyPromise(
        kid: string,
    ): Promise<SigningKey> {
        const client = jwksClient({ jwksUri: JwksUri });
        return new Promise((resolve, reject) => {
            client.getSigningKey(kid, (err, key: SigningKey) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(key);
                }
            });
        });
    }

    public static getJwtVerifyOption(): {
        audience: string;
        issuer: string;
    } {
        return {
            audience: ApiEndpoint,
            issuer: TokenIssuer,
        };
    }
}

export class Auth0ClientError extends LotteryApplicationError {
    public kid: string;
    public constructor(kid: string, cause: Error) {
        super(kid, cause);
        this.kid = kid;
    }
}

export class Auth0ClientJwksRequestError extends Auth0ClientError {}

export class Auth0ClientKeyNotFoundError extends Auth0ClientError {}
