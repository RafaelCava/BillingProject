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

### Primeira execução (criar volumes)

Antes de subir os containers, prepare os diretórios de volume com permissões corretas:

```sh
bash init-volumes.sh
```

Isso cria os diretórios `tmp/prometheus` e `tmp/grafana` com permissões de escrita.

### Subir a stack completa

Suba o MongoDB, API, OpenTelemetry Collector, Prometheus e Grafana via Docker:

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
- `OTEL_METRICS_ENABLED`: habilita/desabilita exportação de métricas (`true` por padrão)
- `OTEL_SERVICE_NAME`: nome do serviço enviado nas métricas (padrão `billing-api`)
- `OTEL_SERVICE_VERSION`: versão do serviço nas métricas (padrão `0.0.1`)
- `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`: endpoint OTLP HTTP completo para métricas (ex.: `http://otel-agent:4318/v1/metrics`)
- `OTEL_EXPORTER_OTLP_ENDPOINT`: endpoint base OTLP HTTP (fallback quando `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` não estiver definido)
- `OTEL_METRIC_EXPORT_INTERVAL`: intervalo de exportação em ms (padrão `10000`)

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

## OpenTelemetry e Métricas

O serviço coleta e exporta métricas via OpenTelemetry (OTLP HTTP). Ao rodar com Docker Compose, um **OpenTelemetry Collector** é iniciado automaticamente para receber e processar as métricas.

### Como validar as métricas localmente

Ao executar `docker compose up`, o container `otel-collector` estará rodando na porta **4318**. As métricas são coletadas e exportadas para **Prometheus** (porta **9090**) e **Grafana** (porta **3001**).

#### 1. Prometheus (métricas brutas)

Acesse em: [http://localhost:9090](http://localhost:9090)

Procure pelas métricas HTTP:
- `http_server_requests_count` — total de requisições
- `http_server_request_duration` — latência em ms

Exemplo de query: `http_server_requests_count{service_name="billing-api"}`

#### 2. Grafana (visualização)

Acesse em: [http://localhost:3001](http://localhost:3001)

**Credenciais padrão:**
- **Usuário:** admin
- **Senha:** admin

**Configurar Prometheus como data source:**

1. Menu → **Connections** → **Data sources**
2. Clique em **Add data source**
3. Selecione **Prometheus**
4. URL: `http://prometheus:9090`
5. Clique em **Save & test**

**Criar dashboard:**

1. Menu → **Dashboards** → **Create** → **New dashboard**
2. Clique em **Add visualization**
3. Selecione o data source **Prometheus**
4. Escreva queries, exemplo:
   ```prometheus
   sum(rate(http_server_requests_count[1m])) by (http_response_status_code)
   ```
5. Configure gráficos, aliases e alertas conforme necessário

### Logs do collector

Para ver em tempo real as métricas sendo processadas:

```sh
docker logs -f otel-collector
```

Você verá saídas do debug exporter com detalhes de todas as métricas recebidas.

### Customizar exportação de métricas

O arquivo [otel-collector-config.yaml](otel-collector-config.yaml) controla para onde as métricas vão. Atualmente exporta para:

- **Debug exporter**: logs detalhados do collector
- **Prometheus exporter**: métricas em formato Prometheus (porta 8889)

Você pode adicionar mais exporters para:

- **Jaeger** (distributed tracing): `jaeger`
- **Grafana Loki** (logs): `loki`
- **Data Dog, New Relic**: backends comerciais

Exemplo: adicionar Loki ao `otel-collector-config.yaml`:

```yaml
exporters:
  debug:
    verbosity: detailed
  prometheus:
    endpoint: 0.0.0.0:8889
  loki:
    endpoint: http://loki:3100/loki/api/v1/push

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug, prometheus, loki]
```

### Variáveis de ambiente OTEL

As variáveis abaixo controlam a captura de métricas da API:

- `OTEL_METRICS_ENABLED`: ativa/desativa exportação (padrão `true`)
- `OTEL_SERVICE_NAME`: nome do serviço nas métricas (padrão `billing-api`)
- `OTEL_SERVICE_VERSION`: versão reportada (padrão `0.0.1`)
- `OTEL_EXPORTER_OTLP_ENDPOINT`: endpoint base do collector (padrão `http://otel-collector:4318`)
- `OTEL_METRIC_EXPORT_INTERVAL`: intervalo de envio em ms (padrão `10000` = 10s)

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

## Troubleshooting

### Erro de permissão no Prometheus ou Grafana

Se você receber erros do tipo `Permission denied` ou `is not writable` nos containers Prometheus/Grafana:

**Solução:**

1. Pare os containers:
   ```sh
   docker compose down
   ```

2. Execute o script de inicialização:
   ```sh
   bash init-volumes.sh
   ```

3. Reinicie:
   ```sh
   docker compose up -d
   ```

### Limpar dados acumulados

Para recomeçar do zero com volumes limpos:

```sh
# Parar containers
docker compose down

# Remover volumes
rm -rf tmp/prometheus tmp/grafana

# Reiniciar
bash init-volumes.sh
docker compose up -d
```
