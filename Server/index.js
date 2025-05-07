import express from 'express';
import connectDB from './config/db.js';
import 'dotenv/config';
import { logger, logRequest } from './core/utils/logger.js';
import authRoutes from './modules/auth/routes.js';
//import wasteRoutes from '.modules/waste/routes.js';

const app = express();

app.use(express.json());
app.use(logRequest);

//Routes per l'autenticazione
app.use("/api/auth", authRoutes);
//Routes per waste (parte principale)
//app.use("api/waste", wasteRoutes);

//Error Handling
app.use((err, res) => {
  logger.error(`Errore: ${err.message}`);
  res.status(500).json({ error: 'Errore interno' });
});

const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server attivo su porta ${PORT}`);
  });
});