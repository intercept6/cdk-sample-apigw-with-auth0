# AWS CDKを使いAPI GatewayでM2M認証をAuth0を使ってやるサンプル

## Useful commands

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint-fix
```

コミット時にも自動で行われます。

### Deploy

```bash
jwksUri='https://${auth0_tenant_name}.auth0.com/.well-known/jwks.json' \
audience='https://${apigw_domain}.execute-api.ap-northeast-1.amazonaws.com/' \
tokenIssue='https://${auth0_tenant_name}.auth0.com' \
npm run cdk deploy
```
