import { Pool, PoolClient } from 'pg';
import { Dado } from '../models/dado.js';

export class PostgresRepository {
  constructor(private readonly pool: Pool) {}

  async inserir(dado: Dado, client?: PoolClient): Promise<void> {
    const conexao = client ?? this.pool;

    await conexao.query(
      'INSERT INTO dados (id, nome, valor) VALUES ($1, $2, $3)',
      [dado.id, dado.nome, dado.valor],
    );
  }

  async excluir(id: string, client?: PoolClient): Promise<void> {
    const conexao = client ?? this.pool;

    await conexao.query('DELETE FROM dados WHERE id = $1', [id]);
  }
  // Cenários 1 e 2:
  // async atualizar(dado: Dado, client?: PoolClient): Promise<void> {
  //   const conexao = client ?? this.pool;

  //   await conexao.query(
  //     'UPDATE dados SET nome = $1, valor = $2 WHERE id = $3',
  //     [dado.nome, dado.valor, dado.id],
  //   );
  // }

  // Cenário 3:

  async atualizar(dado: Dado, client?: PoolClient): Promise<number> {
    const conexao = client ?? this.pool;

    const resultado = await conexao.query(
      'UPDATE dados SET nome = $1, valor = $2 WHERE id = $3',
      [dado.nome, dado.valor, dado.id],
    );

    return resultado.rowCount ?? 0;
  }

  async buscarTodos(client?: PoolClient): Promise<Dado[]> {
    const conexao = client ?? this.pool;

    const resultado = await conexao.query('SELECT id, nome, valor FROM dados');

    return resultado.rows.map((registro) => ({
      id: registro.id,
      nome: registro.nome,
      valor: Number(registro.valor),
    }));
  }
}
