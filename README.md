# Persistência Distribuída com PostgreSQL e MongoDB

Aplicação desenvolvida em Node.js e TypeScript para estudar operações de persistência em dois bancos de dados diferentes: PostgreSQL e MongoDB.

O projeto implementa três cenários de experimentação envolvendo inserções, tratamento de falhas, transações locais, atualização de registros e monitoramento periódico da consistência dos dados.

## Tecnologias

- Node.js
- TypeScript
- Express 5
- PostgreSQL 17
- MongoDB 7
- Docker e Docker Compose
- Driver `pg`
- Driver `mongodb`
- dotenv
- tsx

## Arquitetura

A aplicação utiliza uma arquitetura em camadas, separando as responsabilidades de cada parte do sistema.

```text
src/
├── config/
│   └── database.ts
├── controllers/
│   └── dado.controller.ts
├── models/
│   └── dado.ts
├── repositories/
│   ├── mongo.repository.ts
│   └── postgres.repository.ts
├── routes/
│   └── dado.routes.ts
├── services/
│   ├── monitor.service.ts
│   └── transaction.service.ts
├── app.ts
└── server.ts
```

### Responsabilidades

| Componente   | Responsabilidade                           |
| ------------ | ------------------------------------------ |
| config       | Configuração e conexão com os bancos       |
| controllers  | Recebimento das requisições HTTP           |
| models       | Definição da estrutura dos dados           |
| repositories | Operações de acesso aos bancos             |
| routes       | Definição dos endpoints                    |
| services     | Coordenação das transações e monitoramento |
| app.ts       | Configuração da aplicação Express          |
| server.ts    | Inicialização do servidor e dependências   |

## Cenários implementados

### Cenário 1 — PostgreSQL seguido de MongoDB

Realiza a inserção no PostgreSQL e, em seguida, no MongoDB.

Uma falha pode ser simulada no momento da operação no MongoDB. A aplicação executa rollback na transação do PostgreSQL.

Endpoint:

`POST /api/dados/cenario1`

Exemplo de requisição com falha simulada:

```json
{
  "nome": "Produto A",
  "valor": 150.5,
  "simularFalhaMongo": true
}
```

### Cenário 2 — MongoDB seguido de PostgreSQL

Realiza a inserção no MongoDB e, em seguida, no PostgreSQL.

Uma falha pode ser simulada durante a operação no PostgreSQL. A aplicação aborta a transação do MongoDB e executa rollback na transação do PostgreSQL.

Endpoint:

`POST /api/dados/cenario2`

Exemplo de requisição com falha simulada:

```json
{
  "nome": "Produto B",
  "valor": 200,
  "simularFalhaPostgres": true
}
```

### Cenário 3 — Atualização e monitoramento

Atualiza os registros nos dois bancos enquanto o serviço de monitoramento consulta os dados periodicamente.

O intervalo de consulta pode ser configurado por meio do campo `intervaloMs`.

Endpoint:

`POST /api/dados/cenario3`

Exemplo:

```json
{
  "intervaloMs": 10,
  "atualizacoes": [
    {
      "id": "a995231b-d729-4758-8ad6-80b196feec47",
      "nome": "Produto A",
      "valor": 175.5
    },
    {
      "id": "df0c1367-3baf-404c-9283-7b05fcd8b7f6",
      "nome": "Produto B",
      "valor": 250.0
    }
  ]
}
```

O serviço retorna informações sobre:

- Intervalo de monitoramento.
- Quantidade de consultas realizadas com sucesso.
- Quantidade de consultas com divergência.
- Quantidade de consultas consistentes.
- Falhas durante as consultas.
- Momento da primeira e da última divergência.
- Duração total da execução.

## Requisitos

Antes de executar o projeto, é necessário instalar:

- Node.js e npm.
- Docker.
- Docker Compose.

## Configuração do ambiente

### 1. Clonar o repositório

```bash
git clone https://github.com/WesleyyD/Persist-ncia-Distribu-da-com-PostgreSQL-e-MongoDB.git
cd persistencia-2pc
```

Substitua `URL_DO_REPOSITORIO` pelo endereço do repositório Git.

### 2. Instalar as dependências

```bash
npm install
```

### 3. Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DATABASE=persistencia

MONGO_URI=mongodb://localhost:27017/persistencia?replicaSet=rs0
MONGO_DATABASE=persistencia
```

Ajuste os valores conforme a configuração do ambiente.

### 4. Iniciar os bancos de dados

Na raiz do projeto, execute:

```bash
docker compose up -d
```

Para verificar os contêineres:

```bash
docker ps
```

Os serviços utilizados são:

| Serviço    | Contêiner    | Porta |
| ---------- | ------------ | ----: |
| PostgreSQL | postgres-2pc |  5432 |
| MongoDB    | mongo-2pc    | 27017 |

### 5. Inicializar o replica set do MongoDB

O MongoDB precisa estar configurado como replica set para permitir a utilização de transações.

Caso ainda não tenha sido inicializado, execute:

```bash
docker exec -it mongo-2pc mongosh
```

No shell do MongoDB:

```javascript
rs.initiate();
```

Aguarde a eleição do nó primário. Para verificar:

```javascript
rs.status();
```

O estado esperado para o nó principal é `PRIMARY`.

Essa inicialização deve ser realizada apenas uma vez para o volume persistente, desde que o replica set já não esteja configurado.

## Executando a aplicação

### Modo de desenvolvimento

```bash
npm run dev
```

O servidor será iniciado na porta configurada no arquivo `.env`, utilizando a porta 3000 como padrão.

### Compilação

```bash
npm run build
```

### Execução da versão compilada

```bash
npm start
```

O comando `npm start` executa os arquivos JavaScript gerados na pasta `dist`.

## Testando a API

A aplicação disponibiliza os seguintes endpoints:

| Método | Endpoint              | Descrição                                |
| ------ | --------------------- | ---------------------------------------- |
| GET    | `/api/saude`          | Verifica se a aplicação está em execução |
| POST   | `/api/dados/cenario1` | Inserção PostgreSQL → MongoDB            |
| POST   | `/api/dados/cenario2` | Inserção MongoDB → PostgreSQL            |
| POST   | `/api/dados/cenario3` | Atualização e monitoramento              |

Exemplo de verificação da aplicação:

```bash
curl http://localhost:3000/api/saude
```

## Consultando os dados

### PostgreSQL

Acessar o banco:

```bash
docker exec -it postgres-2pc psql -U postgres -d persistencia
```

Consultar os registros:

```sql
SELECT * FROM dados ORDER BY nome;
```

### MongoDB

Acessar o shell:

```bash
docker exec -it mongo-2pc mongosh
```

Selecionar o banco:

```javascript
use persistencia
```

Consultar os registros:

```javascript
db.dados.find({}, { _id: 0, id: 1, nome: 1, valor: 1 }).sort({ nome: 1 });
```

Contar os documentos:

```javascript
db.dados.countDocuments({});
```

## Encerrando os contêineres

Para parar os serviços:

```bash
docker compose down
```

Para remover também os volumes e os dados persistidos:

```bash
docker compose down -v
```

**Atenção:** o segundo comando apaga os dados armazenados nos volumes dos bancos.

## Observação sobre a implementação

O projeto utiliza transações locais do PostgreSQL e do MongoDB, coordenadas pela aplicação, com tratamento de exceções e operações de rollback/abort nos cenários simulados.
