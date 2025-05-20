
import 'dotenv/config';
import express from 'express';
import connectDB from './config/db.js';
import cors from 'cors';
import { logger, logRequest } from './core/utils/logger.js';
import authRoutes from './modules/auth/routes.js';
import wasteRoutes from './modules/waste/routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js'
import passport from 'passport'

// Inizia connessione al database
connectDB().catch(err => {
  logger.error('Errore iniziale di connessione al database:', err);
  process.exit(1);
});

const app = express();

//Configurazione CORS
const corsOptions = {
  //origin: process.env.CORS_ORIGIN
  origin: process.env.CORS_ORIGIN || '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, //Per supportare i cookies se necessario
  optionsSuccessStatus: 200
};
//middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(passport.initialize());

//routes
app.use("/api/auth", authRoutes);//Routes per l'autenticazione
console.log('Auth routes registered at /api/auth');
app.use("/api/waste", wasteRoutes);//Routes per waste (parte principale)
console.log('Waste routes registered at /api/waste');

//Documentazione Swagge
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

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server attivo su porta ${PORT}`);
    console.log(`Server is running on port ${PORT}`);
  });
});