# BillingProject

API backend para uma plataforma de gerenciamento de gastos, construída com NestJS, MongoDB e Nx.

## Principais recursos

- Autenticação com JWT em cookies HTTP-only
- Autorização por perfil com `admin` e `user`
- Escopo multi-tenant por `accountId`
- CRUD de contas, usuários, compras e tags
- Validação global com `class-validator`
- Documentação Swagger centralizada
- Logs operacionais estruturados

## Estrutura principal

- `apps/billingApi`: aplicação NestJS
- `libs/databases`: schemas e repositórios MongoDB
- `docker-compose.yaml`: stack local da API e banco

## Como rodar

Instale as dependências:

```sh
npm install
```

Suba o MongoDB e a API via Docker:

```sh
docker compose up -d
```

Ou rode somente a API no workspace:

```sh
npx nx serve billingApi
```

Para gerar build:

```sh
npx nx build billingApi
```

## Variáveis de ambiente

Os pontos abaixo precisam estar configurados para o fluxo completo funcionar corretamente:

- `MONGO_CONNECTION`: string de conexão do MongoDB
- `JWT_SECRET`: segredo do access token
- `JWT_REFRESH_SECRET`: segredo do refresh token
- `FRONTEND_URLS`: lista de origens permitidas no CORS, separadas por vírgula
- `NODE_ENV`: afeta o comportamento seguro dos cookies

Exemplo de conexão usada com Docker local:

```env
MONGO_CONNECTION=mongodb://root:example@host.docker.internal:27017/billing?authSource=admin
```

## Swagger

Com a aplicação em execução, a documentação fica disponível em:

```text
/api/docs
```

O Swagger documenta:

- descrições de rota
- payloads esperados
- exemplos de sucesso e erro
- status HTTP
- autenticação por cookie

## Autenticação por cookie

O sistema usa dois cookies HTTP-only:

- `access_token`: usado para autorizar requisições autenticadas
- `refresh_token`: usado para renovar a sessão

Fluxo esperado:

1. Faça `POST /api/auth/login` com email e senha.
2. A API retorna `success: true` e grava os cookies na resposta.
3. Nas próximas requisições, o frontend deve enviar credenciais junto com a chamada.
4. Quando o access token expirar, faça `POST /api/auth/refresh`.
5. Para encerrar a sessão, faça `POST /api/auth/logout`.

Exemplo com fetch:

```ts
await fetch('http://localhost:3000/api/auth/login', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	credentials: 'include',
	body: JSON.stringify({
		email: 'financeiro@empresa.com',
		password: '12345678',
	}),
});
```

Para qualquer rota protegida, o frontend precisa enviar `credentials: 'include'`.

## Perfis e escopo

- `admin`: acessa recursos da conta inteira
- `user`: acessa recursos limitados ao próprio usuário em operações sensíveis, como compras

O `accountId` é resolvido a partir do token autenticado, evitando que o cliente informe esse valor manualmente em rotas protegidas.

## Rotas principais

- `POST /api/accounts`: cria conta e primeiro usuário admin
- `GET /api/accounts`: lista contas, restrito a admin
- `POST /api/auth/login`: cria sessão
- `POST /api/auth/refresh`: renova sessão
- `POST /api/auth/logout`: encerra sessão
- `GET /api/users`: lista usuários da conta do token
- `GET /api/user`: busca usuário por email dentro da conta autenticada
- `POST /api/user`: cria usuário manualmente
- `GET /api/purchases`: lista compras no escopo do token
- `POST /api/purchases`: cria compra
- `GET /api/tags`: lista tags da conta
- `POST /api/tags`: cria tag

## Desenvolvimento

Para ver os targets disponíveis do projeto:

```sh
npx nx show project billingApi
```

Para executar testes quando necessário:

```sh
npx nx test billingApi
```
