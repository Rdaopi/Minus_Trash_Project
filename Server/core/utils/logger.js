import winston from 'winston';

// 1. Creazione del Logger
export const logger = winston.createLogger({
  // 2. Configurazione del Livello di Log
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  
  // 3. Formattazione Base (comune a tutti i trasporti)
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Aggiunge timestamp
    winston.format.errors({ stack: true }), // Registra l'intero stack trace degli errori
    winston.format.json() // Formatta i log in JSON (per file/non-console)
  ),
  
  // 4. Trasporti (Destinazioni dei Log)
  transports: [
    // a) Trasporto Console (Sviluppo)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Aggiunge colori ai livelli (es: rosso per error)
        winston.format.printf(info => 
          `${info.timestamp} [${info.level}]: ${info.message} ${info.stack || ''}` // Formato leggibile
        )
      )
    }),
    
    // b) Trasporto File (Errori in Produzione)
    new winston.transports.File({ 
      filename: 'logs/error.log', // File dedicato agli errori
      level: 'error', // Solo log di livello 'error' o superiore
      maxsize: 5 * 1024 * 1024, // Rotazione automatica a 5MB
      maxFiles: 16 //CHANGE: Numero massimo di file fino a 16
    })
  ]
});

// 5. Middleware per Express
export const logRequest = (req, next) => {
  logger.info(`${req.method} ${req.url}`); // Logga metodo e URL delle richieste
  next(); // Passa al prossimo middleware
};