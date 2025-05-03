import express from 'express';
import dotenv from "dotenv";

//Carica gli attributi del file .env
dotenv.config();

const app = express();
app.use(express.json);

//Connessione al database
import connectDB from './config/db.js';
connectDB();