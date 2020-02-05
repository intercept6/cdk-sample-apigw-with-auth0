import {
    Auth0Client,
    Auth0ClientKeyNotFoundError,
} from '../../infrastructures/auth0/auth0-client';
import { S3JwksCacheBucket } from '../../infrastructures/s3/s3-jwks-cache-bucket';
import * as jwt from 'jsonwebtoken';
import {
    ExternalServiceError,
    InvalidTokenError,
    MalformedTokenError,
    TokenExpiredError,
} from '../error/domain-error-authentication';
import * as Console from 'console';

export class AuthenticationUseCase {
    /**
     * Auth0に問い合わせてトークンのバリデーションを実施します。検証内容：
     * ・kid(キーID、公開鍵に紐づくユニークなキー)を抽出する。
     * ・kidをもとに署名を検証する。成功すると公開鍵が手に入る。
     * ・公開鍵をS3バケットに保存する。次回以降は保存された公開鍵を利用する。
     * ・認証済みの公開鍵を使ってトークンを検証する。
     * @param token 検証対象のトークン
     */
    public static async getAuthentication(
        token: AuthToken,
    ): Promise<ValidToken> {
        try {
            const tokenKid = AuthenticationUseCase.extractKid(token);
            const publicKey = await AuthenticationUseCase.getSigningKey(
                tokenKid,
            );
            return AuthenticationUseCase.verifyToken(token, publicKey);
        } catch (e) {
            if (e instanceof Auth0ClientKeyNotFoundError) {
                throw new InvalidTokenError(token, e);
            } else if (
                e instanceof MalformedTokenError ||
                e instanceof TokenExpiredError ||
                e instanceof InvalidTokenError
            ) {
                throw e;
            }
            throw new ExternalServiceError(token, e);
        }
    }

    /**
     * Bearerトークンをデコードしてkidを抽出します。
     * @param token Bearerトークン
     * @throws InvalidTokenError デコードに失敗した場合
     */
    private static extractKid(token: AuthToken): string {
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded || typeof decoded === 'string') {
            throw new MalformedTokenError(
                token,
                new Error('extractKid failed, jwt.decode failed.'),
            );
        }
        return decoded.header.kid;
    }

    /**
     * 認証済みの公開鍵を使ってトークンを検証します。
     * @param token 検証対象のトークン
     * @param signedPubKey 認証済み公開鍵
     */
    private static verifyToken(
        token: AuthToken,
        signedPubKey: string,
    ): ValidToken {
        try {
            const option = Auth0Client.getJwtVerifyOption();
            return jwt.verify(token, signedPubKey, option) as ValidToken;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new TokenExpiredError(token, error);
            } else {
                throw new InvalidTokenError(token, error);
            }
        }
    }

    /**
     * 認証済みの公開鍵を取得します。
     * キャッシュがある場合は、キャッシュの公開鍵を返却します。
     * キャッシュがない場合は、Auth0から公開鍵を取得します。
     * また、Auth0から取得した公開鍵をキャッシュします。
     * @param tokenKid
     */
    private static async getSigningKey(tokenKid: string): Promise<string> {
        const cachePublicKey = await S3JwksCacheBucket.getCacheSigningKey(
            tokenKid,
        );
        if (cachePublicKey) {
            Console.log('cachePublicKey', cachePublicKey);
            return cachePublicKey;
        }
        const publicKey = await Auth0Client.getSigningKey(tokenKid);
        await S3JwksCacheBucket.putCacheSigningKey(tokenKid, publicKey);
        return publicKey;
    }
}

export type AuthToken = string;

export interface ValidToken {
    aud: string;
    azp: string;
    exp: number;
    gty: string;
    iat: number;
    iss: string;
    sub: string;
}
