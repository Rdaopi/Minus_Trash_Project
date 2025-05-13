import reportService from '../services/reportService.js';
import { logger } from '../../../core/utils/logger.js';
import rateLimit from 'express-rate-limit';

// Rate limiter per le segnalazioni
export const reportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 5, // limite di 5 segnalazioni per IP
    message: {
        error: 'Troppe segnalazioni. Riprova tra 15 minuti.'
    },
});

//Creazione nuova segnalazione
export const createReport = async (req, res) => {
    try {
        const reportData = {
            ...req.body,
            reportedBy: req.user._id
        };
        const report = await reportService.createReport(reportData);
        logger.info(`Nuova segnalazione creata: ${report._id}`);
        res.status(201).json(report);
    } catch (error) {
        logger.error(`Errore nella creazione della segnalazione: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
};

//Recupero di tutte le segnalazioni
export const getAllReports = async (req, res) => {
    try {
        const reports = await reportService.getReports(req.query);
        res.json(reports);
    } catch (error) {
        logger.error(`Errore nel recupero delle segnalazioni: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Recupero segnalazione per ID
export const getReportById = async (req, res) => {
    try {
        const report = await reportService.getReportById(req.params.id);
        if (!report) {
            return res.status(404).json({ error: 'Segnalazione non trovata' });
        }
        res.json(report);
    } catch (error) {
        logger.error(`Errore nel recupero della segnalazione: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Recupero segnalazioni in area
export const getReportsInArea = async (req, res) => {
    try {
        const { longitude, latitude, radius = 1000 } = req.query;
        const reports = await reportService.getNearbyReports(
            [parseFloat(longitude), parseFloat(latitude)],
            parseFloat(radius)
        );
        res.json(reports);
    } catch (error) {
        logger.error(`Errore nel recupero delle segnalazioni nell'area: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Recupero segnalazioni per tipo
export const getReportsByType = async (req, res) => {
    try {
        const reports = await reportService.getReportsByType(req.params.type);
        res.json(reports);
    } catch (error) {
        logger.error(`Errore nel recupero delle segnalazioni per tipo: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Recupero segnalazioni per stato
export const getReportsByStatus = async (req, res) => {
    try {
        const reports = await reportService.getReportsByStatus(req.params.status);
        res.json(reports);
    } catch (error) {
        logger.error(`Errore nel recupero delle segnalazioni per stato: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Recupero segnalazioni urgenti
export const getUrgentReports = async (req, res) => {
    try {
        const reports = await reportService.getUrgentReports();
        res.json(reports);
    } catch (error) {
        logger.error(`Errore nel recupero delle segnalazioni urgenti: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Aggiornamento segnalazione
export const updateReport = async (req, res) => {
    try {
        const report = await reportService.updateReport(req.params.id, req.body);
        if (!report) {
            return res.status(404).json({ error: 'Segnalazione non trovata' });
        }
        res.json(report);
    } catch (error) {
        logger.error(`Errore nell'aggiornamento della segnalazione: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Eliminazione segnalazione
export const deleteReport = async (req, res) => {
    try {
        const report = await reportService.getReportById(req.params.id);
        if (!report) {
            return res.status(404).json({ error: 'Segnalazione non trovata' });
        }
        
        if (report.reportedBy.toString() !== req.user._id.toString() && 
            !req.user.roles?.includes('admin')) {
            return res.status(403).json({ error: 'Non autorizzato' });
        }
        
        await reportService.deleteReport(req.params.id);
        logger.info(`Segnalazione ${req.params.id} eliminata`);
        res.json({ message: 'Segnalazione eliminata con successo' });
    } catch (error) {
        logger.error(`Errore nell'eliminazione della segnalazione: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Verifica segnalazione
export const verifyReport = async (req, res) => {
    try {
        const { notes, estimatedResolutionTime } = req.body;
        const report = await reportService.verifyReport(
            req.params.id,
            req.user._id,
            notes,
            estimatedResolutionTime
        );
        res.json(report);
    } catch (error) {
        logger.error(`Errore nella verifica della segnalazione: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Risoluzione segnalazione
export const resolveReport = async (req, res) => {
    try {
        const { actionTaken, followUpRequired, followUpNotes } = req.body;
        const report = await reportService.resolveReport(
            req.params.id,
            req.user._id,
            actionTaken,
            followUpRequired,
            followUpNotes
        );
        res.json(report);
    } catch (error) {
        logger.error(`Errore nella risoluzione della segnalazione: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Statistiche segnalazioni
export const getReportStats = async (req, res) => {
    try {
        const stats = await reportService.getStats();
        res.json(stats);
    } catch (error) {
        logger.error(`Errore nel recupero delle statistiche: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

export const scheduleIntervention = async (req, res) => {
    try {
        const { date } = req.body;
        const report = await reportService.scheduleIntervention(req.params.id, date);
        res.json(report);
    } catch (error) {
        logger.error(`Errore nella programmazione dell'intervento: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

export const assignReport = async (req, res) => {
    try {
        const { assignedTo } = req.body;
        const report = await reportService.assignReport(req.params.id, assignedTo);
        res.json(report);
    } catch (error) {
        logger.error(`Errore nell'assegnazione della segnalazione: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Recupero commenti di una segnalazione
export const getReportComments = async (req, res) => {
    try {
        const report = await reportService.getReportById(req.params.id);
        
        if (!report) {
            return res.status(404).json({ error: 'Segnalazione non trovata' });
        }

        // Assumendo che i commenti siano memorizzati nel report
        const comments = report.comments || [];
        
        res.json(comments);
    } catch (error) {
        logger.error(`Errore nel recupero dei commenti della segnalazione: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Aggiunta di un commento a una segnalazione
export const addReportComment = async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Testo del commento non specificato' });
        }

        const comment = {
            text,
            author: req.user._id,
            createdAt: new Date()
        };

        const report = await reportService.addComment(req.params.id, comment);
        
        if (!report) {
            return res.status(404).json({ error: 'Segnalazione non trovata' });
        }

        logger.info(`Nuovo commento aggiunto alla segnalazione ${req.params.id}`);
        res.status(201).json(comment);
    } catch (error) {
        logger.error(`Errore nell'aggiunta del commento: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

//Aggiornamento stato segnalazione
export const updateReportStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Stato non specificato' });
        }

        const report = await reportService.updateReportStatus(req.params.id, status, req.user._id);
        
        if (!report) {
            return res.status(404).json({ error: 'Segnalazione non trovata' });
        }

        logger.info(`Stato segnalazione ${req.params.id} aggiornato a: ${status}`);
        res.json(report);
    } catch (error) {
        logger.error(`Errore nell'aggiornamento dello stato della segnalazione: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};