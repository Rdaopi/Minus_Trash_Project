import express from 'express';
import { jwtAuth } from '../auth/middlewares/jwtAuth.js';
import { validateWasteReport } from './middlewares/wasteValidation.js';
import { validateBin } from './middlewares/binValidation.js';
import * as reportController from './controllers/reportController.js';
import * as binController from './controllers/binController.js';

const router = express.Router();

/**
 * @swagger
 * /waste/reports:
 *   get:
 *     tags: [Reports]
 *     summary: Get all waste reports
 *     description: Retrieve a list of all waste reports
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of waste reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WasteReport'
 *   post:
 *     tags: [Reports]
 *     summary: Create a new waste report
 *     description: Submit a new waste report
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WasteReport'
 *     responses:
 *       201:
 *         description: Report created successfully
 *       400:
 *         description: Invalid input data
 */
router.route('/reports')
    .get(jwtAuth, reportController.getAllReports)
    .post(jwtAuth, reportController.reportLimiter, validateWasteReport, reportController.createReport);

/**
 * @swagger
 * /waste/reports/{id}:
 *   get:
 *     tags: [Reports]
 *     summary: Get report by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Report details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WasteReport'
 *   put:
 *     tags: [Reports]
 *     summary: Update report
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WasteReport'
 *     responses:
 *       200:
 *         description: Report updated successfully
 *   delete:
 *     tags: [Reports]
 *     summary: Delete report
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Report deleted successfully
 */
router.route('/reports/:id')
    .get(jwtAuth, reportController.getReportById)
    .put(jwtAuth, validateWasteReport, reportController.updateReport)
    .delete(jwtAuth, reportController.deleteReport);

/**
 * @swagger
 * /waste/reports/{id}/status:
 *   put:
 *     tags: [Reports]
 *     summary: Update report status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, verified, in_progress, resolved]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.route('/reports/:id/status')
    .put(jwtAuth, reportController.updateReportStatus);

/**
 * @swagger
 * /waste/reports/{id}/verify:
 *   post:
 *     tags: [Reports]
 *     summary: Verify report
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Report verified successfully
 */
router.route('/reports/:id/verify')
    .post(jwtAuth, reportController.verifyReport);

/**
 * @swagger
 * /waste/reports/{id}/resolve:
 *   post:
 *     tags: [Reports]
 *     summary: Mark report as resolved
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Report marked as resolved
 */
router.route('/reports/:id/resolve')
    .post(jwtAuth, reportController.resolveReport);

/**
 * @swagger
 * /waste/reports/{id}/comments:
 *   get:
 *     tags: [Reports]
 *     summary: Get report comments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of comments
 *   post:
 *     tags: [Reports]
 *     summary: Add comment to report
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 */
router.route('/reports/:id/comments')
    .get(jwtAuth, reportController.getReportComments)
    .post(jwtAuth, reportController.addReportComment);

/**
 * @swagger
 * /waste/reports/area:
 *   get:
 *     tags: [Reports]
 *     summary: Get reports in area
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of reports in the specified area
 */
router.get('/reports/area', reportController.getReportsInArea);

/**
 * @swagger
 * /waste/reports/type/{type}:
 *   get:
 *     tags: [Reports]
 *     summary: Get reports by type
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [litter, illegal_dumping, bin_issue, other]
 *     responses:
 *       200:
 *         description: List of reports of specified type
 */
router.get('/reports/type/:type', reportController.getReportsByType);

/**
 * @swagger
 * /waste/reports/status/{status}:
 *   get:
 *     tags: [Reports]
 *     summary: Get reports by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, verified, in_progress, resolved]
 *     responses:
 *       200:
 *         description: List of reports with specified status
 */
router.get('/reports/status/:status', reportController.getReportsByStatus);

/**
 * @swagger
 * /waste/reports/urgent:
 *   get:
 *     tags: [Reports]
 *     summary: Get urgent reports
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of urgent reports
 */
router.get('/reports/urgent', jwtAuth, reportController.getUrgentReports);

/**
 * @swagger
 * /waste/bins:
 *   get:
 *     tags: [Bins]
 *     summary: Get all bins
 *     responses:
 *       200:
 *         description: List of all waste bins
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bin'
 *   post:
 *     tags: [Bins]
 *     summary: Create new bin
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
 *         description: Bin created successfully
 */
router.route('/bins')
    .get(binController.getAllBins)
    .post(jwtAuth, validateBin, binController.createBin);

/**
 * @swagger
 * /waste/bins/area:
 *   get:
 *     tags: [Bins]
 *     summary: Get bins in area
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of bins in the specified area
 */
router.get('/bins/area', binController.getBinsInArea);

/**
 * @swagger
 * /waste/bins/type/{type}:
 *   get:
 *     tags: [Bins]
 *     summary: Get bins by type
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [general, recycling, organic]
 *     responses:
 *       200:
 *         description: List of bins of specified type
 */
router.get('/bins/type/:type', binController.getBinsByType);

/**
 * @swagger
 * /waste/bins/maintenance:
 *   get:
 *     tags: [Bins]
 *     summary: Get bins needing maintenance
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of bins that need maintenance
 */
router.get('/bins/maintenance', jwtAuth, binController.getBinsNeedingMaintenance);

/**
 * @swagger
 * /waste/bins/{id}:
 *   get:
 *     tags: [Bins]
 *     summary: Get bin by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bin details
 *   put:
 *     tags: [Bins]
 *     summary: Update bin
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
 *         description: Bin updated successfully
 *   delete:
 *     tags: [Bins]
 *     summary: Delete bin
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
 *         description: Bin deleted successfully
 */
router.route('/bins/:id')
    .get(binController.getBinById)
    .put(jwtAuth, validateBin, binController.updateBin)
    .delete(jwtAuth, binController.deleteBin);

/**
 * @swagger
 * /waste/bins/{id}/status:
 *   put:
 *     tags: [Bins]
 *     summary: Update bin status
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [operational, needs_maintenance, out_of_service]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.route('/bins/:id/status')
    .put(jwtAuth, binController.updateBinStatus);

/**
 * @swagger
 * /waste/stats/reports:
 *   get:
 *     tags: [Statistics]
 *     summary: Get report statistics
 *     responses:
 *       200:
 *         description: Report statistics
 */
router.get('/stats/reports', reportController.getReportStats);

/**
 * @swagger
 * /waste/stats/bins:
 *   get:
 *     tags: [Statistics]
 *     summary: Get bin statistics
 *     responses:
 *       200:
 *         description: Bin statistics
 */
router.get('/stats/bins', binController.getBinStats);

export default router;