import {handler} from '@app/lambda/handler/index';

describe('デフォルトLambda', (): void => {
    test('デフォルトLambdaの応答', async (): Promise<void> => {
        const response = await handler( {
            httpMethod: 'GET',
            path: '/',
        }, {},);
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.status).toBe(200);
        expect(body.message).toBe('OK!!!');
    })
});