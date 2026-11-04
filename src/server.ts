import app from './app.js';
import {
  connectDatabases,
  createPostgresStructure,
  postgresPool,
} from './config/database.js';
import { PostgresRepository } from './repositories/postgres.repository.js';
import { MongoRepository } from './repositories/mongo.repository.js';
import { TransactionService } from './services/transaction.service.js';
import { DadoController } from './controllers/dado.controller.js';
import { criarRotasDado } from './routes/dado.routes.js';
import { MonitorService } from './services/monitor.service.js';

async function startServer() {
  try {
    const mongoDatabase = await connectDatabases();

    await createPostgresStructure();

    const postgresRepository = new PostgresRepository(postgresPool);
    const mongoRepository = new MongoRepository(mongoDatabase);

    const monitorService = new MonitorService(
      postgresRepository,
      mongoRepository,
    );

    const transactionService = new TransactionService(
      postgresRepository,
      mongoRepository,
    );

    const dadoController = new DadoController(
      transactionService,
      monitorService,
    );

    app.use('/api/dados', criarRotasDado(dadoController));

    const port = Number(process.env.PORT) || 3000;

    app.listen(port, () => {
      console.log(`Servidor executando na porta ${port}!`);
    });
  } catch (error) {
    console.error('Erro ao iniciar a aplicação:', error);
    process.exit(1);
  }
}

startServer();
