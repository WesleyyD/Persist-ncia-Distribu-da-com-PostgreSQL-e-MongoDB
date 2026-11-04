import { randomUUID } from 'node:crypto';
import { postgresPool, mongoClient } from '../config/database.js';
import { PostgresRepository } from '../repositories/postgres.repository.js';
import { MongoRepository } from '../repositories/mongo.repository.js';
import { Dado } from '../models/dado.js';

export class TransactionService {
  constructor(
    private readonly postgresRepository: PostgresRepository,
    private readonly mongoRepository: MongoRepository,
  ) {}

  async cenario1(nome: string, valor: number, simularFalhaMongo = false) {
    const dado: Dado = {
      id: randomUUID(),
      nome,
      valor,
    };

    const client = await postgresPool.connect();
    let mongoInserido = false;

    try {
      await client.query('BEGIN');

      await this.postgresRepository.inserir(dado, client);

      if (simularFalhaMongo) {
        throw new Error('Falha simulada ao inserir no MongoDB');
      }

      await this.mongoRepository.inserir(dado);
      mongoInserido = true;

      await client.query('COMMIT');

      return {
        mensagem: 'Dados inseridos nos dois bancos',
        dado,
      };
    } catch (erro) {
      await client.query('ROLLBACK');

      if (mongoInserido) {
        await this.mongoRepository.excluir(dado.id);
      }

      throw erro;
    } finally {
      client.release();
    }
  }

  async cenario2(nome: string, valor: number, simularFalhaPostgres = false) {
    const dado: Dado = {
      id: randomUUID(),
      nome,
      valor,
    };

    const session = mongoClient.startSession();
    const client = await postgresPool.connect();

    try {
      session.startTransaction();

      await this.mongoRepository.inserir(dado, session);

      await client.query('BEGIN');

      if (simularFalhaPostgres) {
        throw new Error('Falha simulada ao inserir no PostgreSQL');
      }

      await this.postgresRepository.inserir(dado, client);

      await client.query('COMMIT');

      await session.commitTransaction();

      return {
        mensagem: 'Dados inseridos nos dois bancos',
        dado,
      };
    } catch (erro) {
      await client.query('ROLLBACK');

      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      throw erro;
    } finally {
      client.release();
      await session.endSession();
    }
  }

  async cenario3(atualizacoes: Dado[]) {
    if (atualizacoes.length === 0) {
      throw new Error('Informe pelo menos um registro para atualizar');
    }

    const session = mongoClient.startSession();
    const client = await postgresPool.connect();

    let postgresConfirmado = false;

    try {
      session.startTransaction();
      await client.query('BEGIN');

      for (const dado of atualizacoes) {
        const registrosPostgres = await this.postgresRepository.atualizar(
          dado,
          client,
        );

        const registrosMongo = await this.mongoRepository.atualizar(
          dado,
          session,
        );

        if (registrosPostgres !== 1 || registrosMongo !== 1) {
          throw new Error(
            `Não foi possível atualizar o registro ${dado.id} nos dois bancos`,
          );
        }
      }

      await client.query('COMMIT');
      postgresConfirmado = true;

      await session.commitTransaction();

      return {
        mensagem: 'Atualizações realizadas nos dois bancos',
        registrosAtualizados: atualizacoes.length,
        atualizacoes,
      };
    } catch (erro) {
      if (!postgresConfirmado) {
        await client.query('ROLLBACK').catch(() => undefined);
      }

      if (session.inTransaction()) {
        await session.abortTransaction().catch(() => undefined);
      }

      throw erro;
    } finally {
      client.release();
      await session.endSession();
    }
  }
}
