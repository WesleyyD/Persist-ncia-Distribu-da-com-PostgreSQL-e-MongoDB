import { PostgresRepository } from '../repositories/postgres.repository.js';
import { MongoRepository } from '../repositories/mongo.repository.js';
import { Dado } from '../models/dado.js';

export class MonitorService {
  constructor(
    private readonly postgresRepository: PostgresRepository,
    private readonly mongoRepository: MongoRepository,
  ) {}

  async executarDurante<T>(intervaloMs: number, operacao: () => Promise<T>) {
    let monitorando = true;
    let totalConsultas = 0;
    let consultasComDivergencia = 0;
    let falhasConsulta = 0;
    let primeiraDivergencia: string | null = null;
    let ultimaDivergencia: string | null = null;

    const inicio = Date.now();

    const consultarBancos = async () => {
      try {
        const [dadosPostgres, dadosMongo] = await Promise.all([
          this.postgresRepository.buscarTodos(),
          this.mongoRepository.buscarTodos(),
        ]);

        totalConsultas++;

        const normalizar = (dados: Dado[]) =>
          dados
            .map(({ id, nome, valor }) => ({
              id,
              nome,
              valor: Number(valor),
            }))
            .sort((a, b) => a.id.localeCompare(b.id));

        const postgres = normalizar(dadosPostgres);
        const mongo = normalizar(dadosMongo);

        const consistente = JSON.stringify(postgres) === JSON.stringify(mongo);

        if (!consistente) {
          consultasComDivergencia++;

          const momento = new Date().toISOString();

          primeiraDivergencia ??= momento;
          ultimaDivergencia = momento;
        }
      } catch {
        falhasConsulta++;
      }
    };

    const monitorar = async () => {
      while (monitorando) {
        await consultarBancos();

        if (monitorando) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, intervaloMs);
          });
        }
      }
    };

    const monitoramento = monitorar();
    let resultado: T;

    try {
      resultado = await operacao();
    } finally {
      monitorando = false;
      await monitoramento;
      await consultarBancos();
    }

    return {
      resultado,
      monitoramento: {
        intervaloMs,
        totalConsultas,
        consultasComDivergencia,
        consultasConsistentes: totalConsultas - consultasComDivergencia,
        falhasConsulta,
        primeiraDivergencia,
        ultimaDivergencia,
        duracaoMs: Date.now() - inicio,
      },
    };
  }
}
