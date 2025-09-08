import 'dotenv/config';
import express from 'express';
import ingestRoutes from './routes/ingestRoutes.js';

const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/ingest', ingestRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Ingest API listening on port ${PORT}`);
});
