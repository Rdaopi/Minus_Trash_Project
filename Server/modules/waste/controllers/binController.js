import binService from '../services/binService.js';
import { logger } from '../../../core/utils/logger.js';

//Creazione nuovo cestino
export const createBin = async (req, res) => {
    try {
        const bin = await binService.createBin(req.body);
        logger.info(`Nuovo cestino creato: ${bin._id}`);
        res.status(201).json(bin);
    } catch (error) {
        logger.error(`Errore nella creazione del cestino: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
};

//Recupero di tutti i cestini
export const getAllBins = async (req, res) => {
    try {
        const bins = await binService.getBins(req.query);
        res.json(bins);
    } catch (error) {
        logger.error(`Errore nel recupero dei cestini: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Recupero cestino per ID
export const getBinById = async (req, res) => {
    try {
        const bin = await binService.getBinById(req.params.id);
        if (!bin) {
            return res.status(404).json({ error: 'Cestino non trovato' });
        }
        res.json(bin);
    } catch (error) {
        logger.error(`Errore nel recupero del cestino: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Aggiornamento cestino
export const updateBin = async (req, res) => {
    try {
        const bin = await binService.updateBin(req.params.id, req.body);
        if (!bin) {
            return res.status(404).json({ error: 'Cestino non trovato' });
        }
        res.json(bin);
    } catch (error) {
        logger.error(`Errore nell'aggiornamento del cestino: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Eliminazione cestino
export const deleteBin = async (req, res) => {
    try {
        await binService.deleteBin(req.params.id);
        logger.info(`Cestino ${req.params.id} eliminato`);
        res.json({ message: 'Cestino eliminato con successo' });
    } catch (error) {
        logger.error(`Errore nell'eliminazione del cestino: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Recupero cestini in area
export const getBinsInArea = async (req, res) => {
    try {
        const { longitude, latitude, radius = 1000 } = req.query;
        const bins = await binService.getNearbyBins(
            [parseFloat(longitude), parseFloat(latitude)],
            parseFloat(radius)
        );
        res.json(bins);
    } catch (error) {
        logger.error(`Errore nel recupero dei cestini nell'area: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Aggiornamento stato cestino
export const updateBinStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const bin = await binService.updateBinStatus(req.params.id, status);
        res.json(bin);
    } catch (error) {
        logger.error(`Errore nell'aggiornamento dello stato del cestino: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Statistiche cestini
export const getBinStats = async (req, res) => {
    try {
        const stats = await binService.getStats();
        res.json(stats);
    } catch (error) {
        logger.error(`Errore nel recupero delle statistiche dei cestini: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};
