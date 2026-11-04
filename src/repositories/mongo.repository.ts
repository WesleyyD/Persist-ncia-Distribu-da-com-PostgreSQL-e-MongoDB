import { Db, ClientSession } from 'mongodb';
import { Dado } from '../models/dado.js';

export class MongoRepository {
  private readonly collection;

  constructor(database: Db) {
    this.collection = database.collection<Dado>('dados');
  }

  async inserir(dado: Dado, session?: ClientSession): Promise<void> {
    await this.collection.insertOne(dado, { session });
  }

  async excluir(id: string, session?: ClientSession): Promise<void> {
    await this.collection.deleteOne({ id }, { session });
  }

  // Cenário 1 e 2:
  // async atualizar(dado: Dado, session?: ClientSession): Promise<void> {
  //   await this.collection.updateOne(
  //     { id: dado.id },
  //     {
  //       $set: {
  //         nome: dado.nome,
  //         valor: dado.valor,
  //       },
  //     },
  //     { session },
  //   );
  // }

  // Cenário 3:
  async atualizar(dado: Dado, session?: ClientSession): Promise<number> {
    const resultado = await this.collection.updateOne(
      { id: dado.id },
      {
        $set: {
          nome: dado.nome,
          valor: dado.valor,
        },
      },
      { session },
    );

    return resultado.matchedCount;
  }

  async buscarTodos(session?: ClientSession): Promise<Dado[]> {
    return this.collection.find({}, { session }).toArray();
  }
}
