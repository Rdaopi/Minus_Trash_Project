// index.js (versione minimalista senza helmet/cors)
import express from 'express';
import connectDB from './config/db.js';
import 'dotenv/config';
import { logger, logRequest } from './core/utils/logger.js';
import authRoutes from './modules/auth/routes.js';

import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

const app = express();

app.use(express.json());
app.use(logRequest);

//Routes
app.use("/api/auth", authRoutes);

app.use('/api-docs', 
  swaggerUi.serve, 
  swaggerUi.setup(swaggerSpec)
);

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