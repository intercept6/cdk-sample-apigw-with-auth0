import * as S3 from 'aws-sdk/clients/s3';
import { S3JwksCacheError } from './s3-jwks-cache-bucket-error';

const Region = process.env.REGION!;
const JwksCacheBucketName = process.env.JWKS_CACHE_BUCKET_NAME!;

const S3Client = new S3({
    region: Region,
    signatureVersion: 'v4',
});

export class S3JwksCacheBucket {
    /**
     * キャッシュされた認証済みの公開鍵を取得します。
     * @param kid TokenKid
     */
    public static async getCacheSigningKey(
        kid: string,
    ): Promise<string | null> {
        const param: S3.GetObjectRequest = {
            Bucket: JwksCacheBucketName,
            Key: kid,
        };
        try {
            const response = await S3Client.getObject(param).promise();
            return response.Body!.toString();
        } catch (e) {
            if (e.code === 'NoSuchKey') {
                return null;
            }
            throw new S3JwksCacheError(
                `failed to get cache file: Bucket:${JwksCacheBucketName}, Path:${kid}`,
                e,
            );
        }
    }

    /**
     * 認証済みの公開鍵をキャッシュします。
     * @param kid TokenKid
     * @param key 公開鍵
     */
    public static async putCacheSigningKey(
        kid: string,
        key: string,
    ): Promise<void> {
        const param: S3.PutObjectRequest = {
            Bucket: JwksCacheBucketName,
            Key: kid,
            Body: key,
        };
        try {
            await S3Client.putObject(param).promise();
        } catch (e) {
            throw new S3JwksCacheError(
                `failed to put cache file: Bucket:${JwksCacheBucketName}, Path:${kid}`,
                e,
            );
        }
    }
}
