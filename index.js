import express from 'express';
import connectDB from './config/db.js';
import 'dotenv/config'; // Importa dotenv all'inizio
import logger from './core/utils/logger.js';
import authRoutes from "./modules/auth/routes.js";

//Configurazione express
const app = express();
app.use(express.json);

//Montaggio route autenticazione
app.use("/api/auth", authRoutes);

//Connessione al database e avvio server
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
    app.listen(PORT, () => {
        logger.info('Server in ascolto su ' + PORT);
        logger.info('Collegamento: ' + process.env.DB_URI);
    });
});