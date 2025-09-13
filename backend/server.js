import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import ingestRoutes from './routes/ingestRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { extractTenant, requireTenantAuth } from './middleware/tenantMiddleware.js';

const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));

// Health check (no tenant required)
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Apply tenant middleware to all ingest routes
app.use('/ingest', extractTenant, requireTenantAuth, ingestRoutes);

// Dashboard routes (with lighter tenant validation)
app.use('/api/dashboard', extractTenant, dashboardRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Multi-tenant Ingest API listening on port ${PORT}`);
});