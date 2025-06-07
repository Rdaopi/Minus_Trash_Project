import reportService from '../services/reportService.js';
import { logger } from '../../../core/utils/logger.js';
import rateLimit from 'express-rate-limit';

// Allow service injection for testing
let currentReportService = reportService;

export const setReportService = (service) => {
    currentReportService = service;
};

export const getReportService = () => currentReportService;

// Filtri validi per i report
export const VALID_REPORT_FILTERS = ['reportType', 'status', 'severity'];

// Rate limiter per le segnalazioni
export const reportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 5, // limite di 5 segnalazioni per IP
    message: {
        error: 'Troppe segnalazioni. Riprova tra 15 minuti.'
    },
});

//Creazione nuova segnalazione
export const createReport = async (req, res, next) => {
    try {
        const reportData = {
            ...req.body,
            reportedBy: req.user._id
        };
        const report = await currentReportService.createReport(reportData);
        logger.info(`Nuova segnalazione creata: ${report._id}`);
        res.status(201).json(report);
    } catch (error) {
        logger.error(`Errore nella creazione della segnalazione: ${error.message}`);
        if (process.env.NODE_ENV !== 'production') {
            res.status(500).json({ error: error.message, stack: error.stack });
        } else {
            res.status(500).json({ error: 'Errore interno' });
        }
    }
};

//Recupero di tutte le segnalazioni con paginazione e validazione filtri
export const getAllReports = async (req, res, next) => {
    try {
        // Validazione filtri
        for (const key in req.query) {
            if (!VALID_REPORT_FILTERS.includes(key) && key !== 'page' && key !== 'limit') {
                logger.warn(`Filtro non valido: ${key}`);
                return res.status(400).json({ error: `Filtro non valido: ${key}` });
            }
        }
        // Filtra solo i campi validi
        const filters = {};
        for (const key of VALID_REPORT_FILTERS) {
            if (req.query[key]) filters[key] = req.query[key];
        }
        // Paginazione
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const reports = await currentReportService.getReports(filters, { skip, limit });
        logger.info(`Recuperati ${reports.length} report (pagina ${page}, limite ${limit})`);
        res.json(reports);
    } catch (error) {
        logger.error(`Errore nel recupero delle segnalazioni: ${error.message}`);
        if (process.env.NODE_ENV !== 'production') {
            res.status(500).json({ error: error.message, stack: error.stack });
        } else {
            res.status(500).json({ error: 'Errore interno' });
        }
    }
};

//Recupero segnalazione per ID
export const getReportById = async (req, res, next) => {
    try {
        const report = await currentReportService.getReportById(req.params.id);
        if (!report) {
            return res.status(404).json({ error: 'Segnalazione non trovata' });
        }
        res.json(report);
    } catch (error) {
        logger.error(`Errore nel recupero della segnalazione: ${error.message}`);
        if (process.env.NODE_ENV !== 'production') {
            res.status(500).json({ error: error.message, stack: error.stack });
        } else {
            res.status(500).json({ error: 'Errore interno' });
        }
    }
};

//Recupero segnalazioni in area
export const getReportsInArea = async (req, res, next) => {
    try {
        const { longitude, latitude, radius = 1000 } = req.query;
        const reports = await currentReportService.getNearbyReports(
            [parseFloat(longitude), parseFloat(latitude)],
            parseFloat(radius)
        );
        res.json(reports);
    } catch (error) {
        logger.error(`Errore nel recupero delle segnalazioni nell'area: ${error.message}`);
        if (process.env.NODE_ENV !== 'production') {
            res.status(500).json({ error: error.message, stack: error.stack });
        } else {
            res.status(500).json({ error: 'Errore interno' });
        }
    }
};

//Recupero segnalazioni per tipo
export const getReportsByType = async (req, res, next) => {
    try {
        const reports = await currentReportService.getReportsByType(req.params.type);
        res.json(reports);
    } catch (error) {
        logger.error(`Errore nel recupero delle segnalazioni per tipo: ${error.message}`);
        if (process.env.NODE_ENV !== 'production') {
            res.status(500).json({ error: error.message, stack: error.stack });
        } else {
            res.status(500).json({ error: 'Errore interno' });
        }
    }
};

//Recupero segnalazioni per stato
export const getReportsByStatus = async (req, res, next) => {
    try {
        const reports = await currentReportService.getReportsByStatus(req.params.status);
        res.json(reports);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            res.status(500).json({ error: error.message, stack: error.stack });
        } else {
            res.status(500).json({ error: 'Errore interno' });
        }
    }
};

//Recupero segnalazioni urgenti
export const getUrgentReports = async (req, res, next) => {
    try {
        const reports = await currentReportService.getUrgentReports();
        res.json(reports);
    } catch (error) {
        logger.error(`Errore nel recupero delle segnalazioni urgenti: ${error.message}`);
        if (process.env.NODE_ENV !== 'production') {
            res.status(500).json({ error: error.message, stack: error.stack });
        } else {
            res.status(500).json({ error: 'Errore interno' });
        }
    }
};

//Aggiornamento segnalazione
export const updateReport = async (req, res, next) => {
    try {
        const report = await currentReportService.updateReport(req.params.id, req.body);
        if (!report) {
            return res.status(404).json({ error: 'Segnalazione non trovata' });
        }
        res.json(report);
    } catch (error) {
        logger.error(`Errore nell'aggiornamento della segnalazione: ${error.message}`);
        if (process.env.NODE_ENV !== 'production') {
            res.status(500).json({ error: error.message, stack: error.stack });
        } else {
            res.status(500).json({ error: 'Errore interno' });
        }
    }
};

//Eliminazione segnalazione
export const deleteReport = async (req, res, next) => {
    try {
        console.log('=== DELETE REPORT DEBUG ===');
        console.log('Report ID:', req.params.id);
        console.log('User ID:', req.user._id);
        console.log('User role:', req.user.role);
        
        const report = await currentReportService.getReportById(req.params.id);
        if (!report) {
            console.log('ERROR: Report not found');
            return res.status(404).json({ error: 'Segnalazione non trovata' });
        }
        
        console.log('Report found:', {
            id: report._id,
            reportedBy: report.reportedBy,
            status: report.status
        });
        
        // Allow deletion if:
        // 1. User is the one who created the report
        // 2. User is an administrator
        // 3. User is a municipal operator (operatore_comunale)
        const isReportOwner = report.reportedBy && report.reportedBy.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'amministratore';
        const isOperator = req.user.role === 'operatore_comunale';
        
        console.log('Authorization check:', {
            isReportOwner,
            isAdmin,
            isOperator,
            reportedByType: typeof report.reportedBy,
            reportedByValue: report.reportedBy
        });
        
        if (!isReportOwner && !isAdmin && !isOperator) {
            console.log('ERROR: Not authorized');
            return res.status(403).json({ error: 'Non autorizzato' });
        }
        
        console.log('Authorization passed, deleting report...');
        await currentReportService.deleteReport(req.params.id);
        console.log('Report deleted successfully');
        
        logger.info(`Segnalazione ${req.params.id} eliminata`);
        res.json({ message: 'Segnalazione eliminata con successo' });
    } catch (error) {
        logger.error(`Errore nell'eliminazione della segnalazione: ${error.message}`);
        if (process.env.NODE_ENV !== 'production') {
            res.status(500).json({ error: error.message, stack: error.stack });
        } else {
            res.status(500).json({ error: 'Errore interno' });
        }
    }
};

//Verifica segnalazione
export const verifyReport = async (req, res, next) => {
    try {
        const { notes, estimatedResolutionTime } = req.body;
        const report = await currentReportService.verifyReport(
            req.params.id,
            req.user._id,
            notes,
            estimatedResolutionTime
        );
        res.json(report);
    } catch (error) {
        logger.error(`Errore nella verifica della segnalazione: ${error.message}`);
        next(error);
    }
};

//Risoluzione segnalazione
export const resolveReport = async (req, res, next) => {
    try {
        const { actionTaken, followUpRequired, followUpNotes } = req.body;
        const report = await currentReportService.resolveReport(
            req.params.id,
            req.user._id,
            actionTaken,
            followUpRequired,
            followUpNotes
        );
        res.json(report);
    } catch (error) {
        logger.error(`Errore nella risoluzione della segnalazione: ${error.message}`);
        next(error);
    }
};

//Statistiche segnalazioni
export const getReportStats = async (req, res, next) => {
    try {
        const stats = await currentReportService.getReportStats();
        res.json(stats);
    } catch (error) {
        logger.error(`Errore nel recupero delle statistiche: ${error.message}`);
        if (process.env.NODE_ENV !== 'production') {
            res.status(500).json({ error: error.message, stack: error.stack });
        } else {
            res.status(500).json({ error: 'Errore interno' });
        }
    }
};

export const scheduleIntervention = async (req, res, next) => {
    try {
        const { date } = req.body;
        const report = await currentReportService.scheduleIntervention(req.params.id, date);
        res.json(report);
    } catch (error) {
        logger.error(`Errore nella programmazione dell'intervento: ${error.message}`);
        next(error);
    }
};

export const assignReport = async (req, res, next) => {
    try {
        const { assignedTo } = req.body;
        const report = await currentReportService.assignReport(req.params.id, assignedTo);
        res.json(report);
    } catch (error) {
        logger.error(`Errore nell'assegnazione della segnalazione: ${error.message}`);
        next(error);
    }
};

//Recupero commenti di una segnalazione
export const getReportComments = async (req, res, next) => {
    try {
        const report = await currentReportService.getReportById(req.params.id);
        if (!report) {
            return res.status(404).json({ error: 'Segnalazione non trovata' });
        }
        // Assumendo che i commenti siano memorizzati nel report
        const comments = report.comments || [];
        res.json(comments);
    } catch (error) {
        logger.error(`Errore nel recupero dei commenti della segnalazione: ${error.message}`);
        next(error);
    }
};

//Aggiunta di un commento a una segnalazione
export const addReportComment = async (req, res, next) => {
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
        const report = await currentReportService.addComment(req.params.id, comment);
        if (!report) {
            return res.status(404).json({ error: 'Segnalazione non trovata' });
        }
        logger.info(`Nuovo commento aggiunto alla segnalazione ${req.params.id}`);
        res.status(201).json(comment);
    } catch (error) {
        logger.error(`Errore nell'aggiunta del commento: ${error.message}`);
        next(error);
    }
};

//Aggiornamento stato segnalazione
export const updateReportStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'Stato non specificato' });
        }
        const report = await currentReportService.updateReportStatus(req.params.id, status, req.user._id);
        if (!report) {
            return res.status(404).json({ error: 'Segnalazione non trovata' });
        }
        logger.info(`Stato segnalazione ${req.params.id} aggiornato a: ${status}`);
        res.json(report);
    } catch (error) {
        logger.error(`Errore nell'aggiornamento dello stato della segnalazione: ${error.message}`);
        next(error);
    }
};