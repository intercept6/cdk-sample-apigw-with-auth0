exports.handler = (event: any, context: any, callback: any) => {
    callback(null, {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify({
            status: 200,
            message: 'OK!!!'
        })
    });
};
