import { Router } from 'express';
import { DadoController } from '../controllers/dado.controller.js';

export function criarRotasDado(controller: DadoController): Router {
  const router = Router();

  router.post('/cenario1', (req, res) => {
    controller.executarCenario1(req, res);
  });

  router.post('/cenario2', (req, res) => {
    controller.executarCenario2(req, res);
  });

  router.post('/cenario3', (req, res) => {
    controller.executarCenario3(req, res);
  });

  return router;
}
