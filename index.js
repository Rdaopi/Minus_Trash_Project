import express from 'express';
//Carica gli attributi del file .env
dotenv.config();

const app = express();
app.use(express.json);

//Connessione al database
import 'dotenv/config'; // Importa dotenv all'inizio
import connectDB from './config/db.js';
connectDB().then(() => {
    app.listen(3000, () => {
        console.log("Server in ascolto sulla porta 3000");
    });
});