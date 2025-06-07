import binService from '../services/binService.js';
import { logger } from '../../../core/utils/logger.js';

// Allow service injection for testing
let currentBinService = binService;

export const setBinService = (service) => {
    currentBinService = service;
};

export const getBinService = () => currentBinService;

//Creazione nuovo cestino
export const createBin = async (req, res) => {
    try {
        const bin = await currentBinService.createBin(req.body);
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
        const bins = await currentBinService.getBins(req.query);
        res.json(bins);
    } catch (error) {
        logger.error(`Errore nel recupero dei cestini: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Recupero cestino per ID
export const getBinById = async (req, res) => {
    try {
        const bin = await currentBinService.getBinById(req.params.id);
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
        const bin = await currentBinService.updateBin(req.params.id, req.body);
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
        await currentBinService.deleteBin(req.params.id);
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
        const bins = await currentBinService.getNearbyBins(
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
        const bin = await currentBinService.updateBinStatus(req.params.id, status);
        res.json(bin);
    } catch (error) {
        logger.error(`Errore nell'aggiornamento dello stato del cestino: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Statistiche cestini
export const getBinStats = async (req, res) => {
    try {
        const stats = {
            total: await currentBinService.countBins(),
            byType: await currentBinService.countBinsByType(),
            needingMaintenance: await currentBinService.countBinsNeedingMaintenance(),
            fillLevelAverage: await currentBinService.getAverageFillLevel()
        };

        logger.info('Statistiche cestini recuperate con successo');
        res.json(stats);
    } catch (error) {
        logger.error(`Errore nel recupero delle statistiche dei cestini: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Recupero cestini per tipo
export const getBinsByType = async (req, res) => {
    try {
        const bins = await currentBinService.getBinsByType(req.params.type);
        res.json(bins);
    } catch (error) {
        logger.error(`Errore nel recupero dei cestini per tipo: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Recupero cestini che necessitano manutenzione
export const getBinsNeedingMaintenance = async (req, res) => {
    try {
        const bins = await currentBinService.getBinsNeedingMaintenance();
        res.json(bins);
    } catch (error) {
        logger.error(`Errore nel recupero dei cestini da manutenere: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};
