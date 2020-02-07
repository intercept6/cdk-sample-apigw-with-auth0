import {APIGatewayProxyResult} from 'aws-lambda';


export async function handler(event: DefaultEvent, context: any): Promise<APIGatewayProxyResult> {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify({
            status: 200,
            message: 'OK!!!'
        })
    };
}

export type DefaultEvent = {
    httpMethod: 'GET' | 'PUT' | 'POST' | 'DELETE';
    path: string
}