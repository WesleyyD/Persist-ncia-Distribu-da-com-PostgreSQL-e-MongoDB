import express from 'express';

const app = express();

app.use(express.json());

app.get('/api/saude', (req, res) => {
  res.status(200).json({
    mensagem: 'Aplicação em execução!',
  });
});

export default app;
