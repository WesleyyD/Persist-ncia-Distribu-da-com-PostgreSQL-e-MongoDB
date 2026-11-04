import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service.js';
import { MonitorService } from '../services/monitor.service.js';

export class DadoController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly monitorService: MonitorService,
  ) {}

  async executarCenario1(req: Request, res: Response): Promise<void> {
    try {
      const { nome, valor, simularFalhaMongo } = req.body;

      const resultado = await this.transactionService.cenario1(
        nome,
        valor,
        simularFalhaMongo,
      );

      res.status(201).json(resultado);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro interno';

      res.status(500).json({ mensagem });
    }
  }

  async executarCenario2(req: Request, res: Response): Promise<void> {
    try {
      const { nome, valor, simularFalhaPostgres } = req.body;

      const resultado = await this.transactionService.cenario2(
        nome,
        valor,
        simularFalhaPostgres,
      );

      res.status(201).json(resultado);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro interno';

      res.status(500).json({ mensagem });
    }
  }

  async executarCenario3(req: Request, res: Response): Promise<void> {
    try {
      const { atualizacoes, intervaloMs = 10 } = req.body;

      if (!Array.isArray(atualizacoes) || atualizacoes.length === 0) {
        res.status(400).json({
          mensagem: 'Informe uma lista de registros para atualizar',
        });
        return;
      }

      if (!Number.isInteger(intervaloMs) || intervaloMs < 1) {
        res.status(400).json({
          mensagem: 'O intervalo deve ser um número inteiro positivo',
        });
        return;
      }

      const resultado = await this.monitorService.executarDurante(
        intervaloMs,
        () => this.transactionService.cenario3(atualizacoes),
      );

      res.status(200).json(resultado);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro interno';

      res.status(500).json({ mensagem });
    }
  }
}
