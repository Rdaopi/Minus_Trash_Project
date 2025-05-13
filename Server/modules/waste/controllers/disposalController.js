import Waste from '../models/Waste.js';
import { logger } from '../../../core/utils/logger.js';

// Crea una nuova segnalazione di rifiuti
export const createWasteReport = async (req, res) => {
    try {
        const waste = new Waste({
            ...req.body,
            reportedBy: req.user._id // Assume che l'utente sia stato autenticato
        });
        await waste.save();
        logger.info(`Nuovo rifiuto segnalato: ${waste._id}`);
        res.status(201).json(waste);
    } catch (error) {
        logger.error(`Errore nella creazione del report: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
};

// Ottiene tutti i rifiuti in un'area specifica
export const getWasteInArea = async (req, res) => {
    try {
        const { longitude, latitude, radius } = req.query; // radius in metri
        const wastes = await Waste.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(radius)
                }
            }
        });
        res.json(wastes);
    } catch (error) {
        logger.error(`Errore nel recupero dei rifiuti nell'area: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Aggiorna lo stato di un rifiuto
export const updateWasteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const waste = await Waste.findByIdAndUpdate(
            id,
            { 
                status,
                updatedAt: Date.now()
            },
            { new: true }
        );
        if (!waste) {
            return res.status(404).json({ error: 'Rifiuto non trovato' });
        }
        logger.info(`Stato del rifiuto ${id} aggiornato a: ${status}`);
        res.json(waste);
    } catch (error) {
        logger.error(`Errore nell'aggiornamento dello stato: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Elimina una segnalazione di rifiuti
export const deleteWasteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const waste = await Waste.findById(id);
        
        if (!waste) {
            return res.status(404).json({ error: 'Rifiuto non trovato' });
        }
        
        // Verifica che l'utente sia il proprietario del report o un admin
        if (waste.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorizzato' });
        }
        
        await waste.deleteOne();
        logger.info(`Report rifiuto ${id} eliminato`);
        res.json({ message: 'Report eliminato con successo' });
    } catch (error) {
        logger.error(`Errore nell'eliminazione del report: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Ottiene le statistiche dei rifiuti
export const getWasteStats = async (req, res) => {
    try {
        const stats = await Waste.aggregate([
            {
                $group: {
                    _id: '$type',
                    totalWeight: { $sum: '$weight' },
                    count: { $sum: 1 }
                }
            }
        ]);
        res.json(stats);
    } catch (error) {
        logger.error(`Errore nel recupero delle statistiche: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};
