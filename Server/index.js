import express from 'express';
import connectDB from './config/db.js';
import 'dotenv/config';
import cors from 'cors';
import { logger, logRequest } from './core/utils/logger.js';
import authRoutes from './modules/auth/routes.js';
import wasteRoutes from './modules/waste/routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

// Inizia connessione al database
connectDB().catch(err => {
  logger.error('Errore iniziale di connessione al database:', err);
  process.exit(1);
});

const app = express();

//Configurazione CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, //Per supportare i cookies se necessario
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

//Routes per l'autenticazione
app.use("/api/auth", authRoutes);
//Routes per waste (parte principale)
app.use("/api/waste", wasteRoutes);

app.use('/api-docs', 
  swaggerUi.serve, 
  swaggerUi.setup(swaggerSpec)
);

app.use(logRequest);

app.get('/test-next', (req, res) => {
  console.log("TEST-NEXT typeof next:", typeof undefined);
  res.json({ ok: true });
});

//Error Handling
app.use((err, req, res, next) => {
  console.log("DEBUG ERRORE:", err);
  if (!err) {
    return;
  }
  logger.error(`Errore: ${err.message}`);
  res.status(500).json({ error: 'Errore interno' });
});

const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server attivo su porta ${PORT}`);
  });
});