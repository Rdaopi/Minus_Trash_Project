import express from 'express';
import { jwtAuth } from '../auth/middlewares/jwtAuth.js';
import { validateWasteReport } from './middlewares/wasteValidation.js';
import { validateBin } from './middlewares/binValidation.js';
import * as reportController from './controllers/reportController.js';
import * as binController from './controllers/binController.js';

const router = express.Router();


//Reports Routes (Segnalazioni)
//BASE PATH: /api/waste/reports
router.route('/reports')
    .get(jwtAuth, reportController.getAllReports) //GET /reports - Lista tutte le segnalazioni
    .post(jwtAuth, reportController.reportLimiter, validateWasteReport, reportController.createReport); //POST /reports - Crea nuova segnalazione

router.route('/reports/:id')
    .get(jwtAuth, reportController.getReportById)//GET /reports/:id - Dettaglio segnalazione
    .put(jwtAuth, validateWasteReport, reportController.updateReport) //PUT /reports/:id - Aggiorna segnalazione
    .delete(jwtAuth, reportController.deleteReport);//DELETE /reports/:id - Elimina segnalazione

//Report Status Management
router.route('/reports/:id/status')
    .put(jwtAuth, reportController.updateReportStatus); //PUT /reports/:id/status - Aggiorna stato

//Report
router.route('/reports/:id/verify')
    .post(jwtAuth, reportController.verifyReport);//POST /reports/:id/verify - Verifica segnalazione

router.route('/reports/:id/resolve')
    .post(jwtAuth, reportController.resolveReport);//POST /reports/:id/resolve - Risolvi segnalazione

router.route('/reports/:id/comments')
    .get(jwtAuth, reportController.getReportComments)//GET /reports/:id/comments - Lista commenti
    .post(jwtAuth, reportController.addReportComment);//POST /reports/:id/comments - Aggiungi commento

//Report
router.get('/reports/area', reportController.getReportsInArea);//GET /reports/area?lat=x&lng=y - Segnalazioni in area
router.get('/reports/type/:type', reportController.getReportsByType);//GET /reports/type/:type - Filtra per tipo
router.get('/reports/status/:status', reportController.getReportsByStatus);//GET /reports/status/:status - Filtra per stato
router.get('/reports/urgent', jwtAuth, reportController.getUrgentReports);//GET /reports/urgent - Segnalazioni urgenti

//Bins Routes (Cestini)
//BASE PATH: /api/waste/bins
router.route('/bins')
    .get(binController.getAllBins)//GET /bins - Lista tutti i cestini
    .post(jwtAuth, validateBin, binController.createBin);//POST /bins - Crea nuovo cestino

//Bin Filters
router.get('/bins/area', binController.getBinsInArea);//GET /bins/area?lat=x&lng=y - Cestini in area
router.get('/bins/type/:type', binController.getBinsByType);//GET /bins/type/:type - Filtra per tipo
router.get('/bins/maintenance', jwtAuth, binController.getBinsNeedingMaintenance); //GET /bins/maintenance - Cestini da manutenere

router.route('/bins/:id')
    .get(binController.getBinById)//GET /bins/:id - Dettaglio cestino
    .put(jwtAuth, validateBin, binController.updateBin)//PUT /bins/:id - Aggiorna cestino
    .delete(jwtAuth, binController.deleteBin);//DELETE /bins/:id - Elimina cestino

//Bin Status Management
router.route('/bins/:id/status')
    .put(jwtAuth, binController.updateBinStatus);//PUT /bins/:id/status - Aggiorna stato

//Statistics Routes
router.get('/stats/reports', reportController.getReportStats);//GET /stats/reports - Statistiche segnalazioni
router.get('/stats/bins', binController.getBinStats);//GET /stats/bins - Statistiche cestini

export default router;