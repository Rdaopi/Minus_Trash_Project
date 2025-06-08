import 'dotenv/config';
import express from 'express';
import connectDB from './config/db.js';
import cors from 'cors';
import { logger, logRequest } from './core/utils/logger.js';
import authRoutes from './modules/auth/routes.js';
import wasteRoutes from './modules/waste/routes.js';
import messageRoutes from './modules/message/message.routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js'
import passport from 'passport'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inizia connessione al database
connectDB().catch(err => {
  logger.error('Errore iniziale di connessione al database:', err);
  process.exit(1);
});

const app = express();

//Configurazione CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        process.env.BACKEND_URL,
        'https://*.onrender.com'  // Allow all subdomains on render.com
      ].filter(Boolean)  // Remove any undefined values
    : '*',  // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};
//middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(passport.initialize());

//routes
app.use("/api", authRoutes);//Routes per l'autenticazione
console.log('Auth routes registered at /api');
app.use("/api/", wasteRoutes);//Routes per waste (parte principale)
console.log('Waste routes registered at /api/');
app.use("/api/messages", messageRoutes);//Routes per i messaggi
console.log('Message routes registered at /api/messages');

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

// Middleware per gestire il routing lato client
// Comment out these lines if you don't want to serve the frontend
// app.use(express.static(path.join(__dirname, '../FrontEnd/dist')));
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../FrontEnd/dist', 'index.html'));
// });

// Add a simple API status route
app.get('/', (req, res) => {
  res.json({ 
    status: 'API running', 
    endpoints: {
      auth: '/api/auth',
      waste: '/api/',
      docs: '/api-docs'
    }
  });
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