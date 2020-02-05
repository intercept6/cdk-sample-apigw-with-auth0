// import 'source-map-support/register';
// import { AuthenticationUseCase } from '../domains/authentication/authentication-use-case';
// import {
//     ApiGatewayUnauthorizedError,
//     ExpiredAuthTokenError,
//     InvalidAuthHeaderError,
//     InvalidAuthTokenError,
// } from '../error/handler-error-auth';
// import {
//     LotteryHandlerError,
//     LotteryServerError,
// } from '../error/handler-error-base';
// import {
//     InvalidTokenError,
//     MalformedTokenError,
//     TokenExpiredError,
// } from '../../domains/error/domain-error-authentication';
// import { NotifyUseCase } from '../../domains/notify/notify-use-case';

export async function handler(
    event: LambdaAuthorizerEvent,
): Promise<LambdaAuthorizerResponse> {
    return ApigAuthenticationController.authentication(event);
}

export class ApigAuthenticationController {
    public static async authentication(
        event: LambdaAuthorizerEvent,
    ): Promise<LambdaAuthorizerResponse> {
        try {
            // const token: string = await ApigAuthenticationController.extractToken(
            //     event,
            // );
            // const validToken = await AuthenticationUseCase.getAuthentication(
            //     token,
            // );
            return ApigAuthenticationController.generateAllowPolicy(
                'allAllow',
                // validToken.sub,
                'arn:aws:execute-api:*'
                // event.methodArn,
            );
        } catch (e) {
            await NotifyUseCase.notifyAuthenticationError(
                e,
                event.authorizationToken,
            );
            if (e instanceof InvalidAuthHeaderError) {
                // ヘッダが不正の場合、認可の話に行く前に認証エラーが確定
                throw new ApiGatewayUnauthorizedError();
            } else if (e instanceof TokenExpiredError) {
                // トークン不正の場合、期限切れをクライアントに伝える必要がある
                // メッセージをカスタマイズするためには、403エラーにせざるをえない（API Gateway制限）
                const expiredTokenError = new ExpiredAuthTokenError(e);
                return ApigAuthenticationController.generateDenyPolicy(
                    expiredTokenError,
                );
            } else if (
                e instanceof MalformedTokenError ||
                e instanceof InvalidTokenError
            ) {
                const invalidTokenError = new InvalidAuthTokenError(e);
                return ApigAuthenticationController.generateDenyPolicy(
                    invalidTokenError,
                );
            } else {
                // それ以外はサーバーエラーにする
                throw new LotteryServerError();
            }
        }
    }

    /**
     * LambdaAuthorizerEvent からトークンの文字列を抽出します
     * @param event LambdaAuthorizerEvent
     */
    private static async extractToken(
        event: LambdaAuthorizerEvent,
    ): Promise<string> {
        const authToken = event.authorizationToken.match(/^Bearer (.*)$/);
        if (!authToken || authToken.length < 2) {
            throw new InvalidAuthHeaderError(event.authorizationToken);
        }
        return authToken[1]; // token body
    }

    /**
     * API Gateway へ返却するAllowポリシーを生成します。
     * @param principalId principalIdとして指定する値です。今回はAuth0から得られたJWTトークンのSubjectを指定します。
     * @param resource API Gatewayの場合はメソッド
     */
    private static generateAllowPolicy(
        principalId: string,
        resource: string,
    ): LambdaAuthorizerResponse {
        return {
            principalId: principalId,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: resource,
                    },
                ],
            },
            context: {},
        };
    }

    /**
     * API Gateway へ返却するDenyポリシーを生成します。
     */
    private static generateDenyPolicy(
        error: LotteryHandlerError,
    ): LambdaAuthorizerResponse {
        return {
            principalId: '*',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Deny',
                        Resource: '*',
                    },
                ],
            },
            context: {
                message: error.message,
            },
        };
    }
}

export interface LambdaAuthorizerEvent {
    type: 'TOKEN';
    methodArn: string;
    authorizationToken: string;
}

export interface LambdaAuthorizerResponse {
    principalId: string;
    policyDocument: {
        Version: string;
        Statement: Statement[];
    };
    context: object;
}

interface Statement {
    Action: string;
    Effect: string;
    Resource: string;
}
