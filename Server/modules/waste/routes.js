import express from 'express';
import { jwtAuth } from '../auth/middlewares/jwtAuth.js';
import { validateWasteReport } from './middlewares/wasteValidation.js';
import { validateBin } from './middlewares/binValidation.js';
import * as reportController from './controllers/reportController.js';
import * as binController from './controllers/binController.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - location
 *         - type
 *       properties:
 *         title:
 *           type: string
 *           description: Titolo della segnalazione
 *         description:
 *           type: string
 *           description: Descrizione della segnalazione
 *         location:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               default: Point
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *               description: [longitude, latitude]
 *         type:
 *           type: string
 *           enum: [abbandono, cestino_pieno, cestino_danneggiato, altro]
 *         status:
 *           type: string
 *           enum: [segnalato, verificato, in_corso, risolto, archiviato]
 *           default: segnalato
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *         urgency:
 *           type: string
 *           enum: [bassa, media, alta]
 *           default: media
 *     Bin:
 *       type: object
 *       required:
 *         - location
 *         - type
 *       properties:
 *         location:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               default: Point
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *               description: [longitude, latitude]
 *         type:
 *           type: string
 *           enum: [indifferenziato, carta, plastica, vetro, organico]
 *         status:
 *           type: string
 *           enum: [operativo, manutenzione, pieno, danneggiato]
 *           default: operativo
 *         capacity:
 *           type: number
 *           description: Capacità in litri
 *         fillLevel:
 *           type: number
 *           description: Livello di riempimento (0-100)
 */

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Gestione segnalazioni di rifiuti
 */

/**
 * @swagger
 * tags:
 *   name: Bins
 *   description: Gestione cestini intelligenti
 */

//Reports Routes (Segnalazioni)
//BASE PATH: /api/waste/reports

/**
 * @swagger
 * /api/waste/reports:
 *   get:
 *     summary: Recupera tutte le segnalazioni
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista di segnalazioni
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Report'
 *   post:
 *     summary: Crea una nuova segnalazione
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Report'
 *     responses:
 *       201:
 *         description: Segnalazione creata con successo
 */
router.route('/reports')
    .get(jwtAuth, reportController.getAllReports) //GET /reports - Lista tutte le segnalazioni
    .post(jwtAuth, reportController.reportLimiter, validateWasteReport, reportController.createReport); //POST /reports - Crea nuova segnalazione

/**
 * @swagger
 * /api/waste/reports/{id}:
 *   get:
 *     summary: Recupera una segnalazione per ID
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dettaglio della segnalazione
 *       404:
 *         description: Segnalazione non trovata
 *   put:
 *     summary: Aggiorna una segnalazione
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Report'
 *     responses:
 *       200:
 *         description: Segnalazione aggiornata
 *   delete:
 *     summary: Elimina una segnalazione
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Segnalazione eliminata
 */
router.route('/reports/:id')
    .get(jwtAuth, reportController.getReportById)//GET /reports/:id - Dettaglio segnalazione
    .put(jwtAuth, validateWasteReport, reportController.updateReport) //PUT /reports/:id - Aggiorna segnalazione
    .delete(jwtAuth, reportController.deleteReport);//DELETE /reports/:id - Elimina segnalazione

/**
 * @swagger
 * /api/waste/reports/{id}/status:
 *   put:
 *     summary: Aggiorna lo stato di una segnalazione
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [segnalato, verificato, in_corso, risolto, archiviato]
 *     responses:
 *       200:
 *         description: Stato aggiornato
 */
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

/**
 * @swagger
 * /api/waste/bins:
 *   get:
 *     summary: Recupera tutti i cestini
 *     tags: [Bins]
 *     responses:
 *       200:
 *         description: Lista di cestini
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bin'
 *   post:
 *     summary: Crea un nuovo cestino
 *     tags: [Bins]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Bin'
 *     responses:
 *       201:
 *         description: Cestino creato con successo
 */
router.route('/bins')
    .get(binController.getAllBins)//GET /bins - Lista tutti i cestini
    .post(/*jwtAuth, */validateBin, binController.createBin);//POST /bins - Crea nuovo cestino
    // TODO: Add jwtAuth to the post route

//Bin Filters
router.get('/bins/area', binController.getBinsInArea);//GET /bins/area?lat=x&lng=y - Cestini in area
router.get('/bins/type/:type', binController.getBinsByType);//GET /bins/type/:type - Filtra per tipo
router.get('/bins/maintenance', jwtAuth, binController.getBinsNeedingMaintenance); //GET /bins/maintenance - Cestini da manutenere

/**
 * @swagger
 * /api/waste/bins/{id}:
 *   get:
 *     summary: Recupera un cestino per ID
 *     tags: [Bins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dettaglio del cestino
 *       404:
 *         description: Cestino non trovato
 *   put:
 *     summary: Aggiorna un cestino
 *     tags: [Bins]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Bin'
 *     responses:
 *       200:
 *         description: Cestino aggiornato
 *   delete:
 *     summary: Elimina un cestino
 *     tags: [Bins]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cestino eliminato
 */
router.route('/bins/:id')
    .get(binController.getBinById)//GET /bins/:id - Dettaglio cestino
    .put(jwtAuth, validateBin, binController.updateBin)//PUT /bins/:id - Aggiorna cestino
    .delete(jwtAuth, binController.deleteBin);//DELETE /bins/:id - Elimina cestino

//Bin Status Management
/**
 * @swagger
 * /api/waste/bins/{id}/status:
 *   put:
 *     summary: Aggiorna lo stato di un cestino
 *     tags: [Bins]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [operativo, manutenzione, pieno, danneggiato]
 *     responses:
 *       200:
 *         description: Stato aggiornato
 */
router.route('/bins/:id/status')
    .put(jwtAuth, binController.updateBinStatus);//PUT /bins/:id/status - Aggiorna stato

//Statistics Routes
router.get('/stats/reports', reportController.getReportStats);//GET /stats/reports - Statistiche segnalazioni
router.get('/stats/bins', binController.getBinStats);//GET /stats/bins - Statistiche cestini

export default router;