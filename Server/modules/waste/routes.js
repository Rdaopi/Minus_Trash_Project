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
 *       title: Report
 *       description: Segnalazione di un problema legato ai rifiuti
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - location
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           description: ID univoco della segnalazione
 *           example: "507f1f77bcf86cd799439012"
 *         title:
 *           type: string
 *           description: Titolo breve e descrittivo della segnalazione
 *           minLength: 5
 *           maxLength: 100
 *           example: "Cestino pieno in Via Roma"
 *         description:
 *           type: string
 *           description: Descrizione dettagliata del problema riscontrato
 *           minLength: 10
 *           maxLength: 500
 *           example: "Il cestino è completamente pieno e i rifiuti traboccano"
 *         location:
 *           type: object
 *           description: Posizione geografica della segnalazione (formato GeoJSON)
 *           required:
 *             - type
 *             - coordinates
 *           properties:
 *             type:
 *               type: string
 *               enum: [Point]
 *               default: Point
 *               description: Tipo di geometria (sempre Point)
 *               example: "Point"
 *             coordinates:
 *               type: array
 *               description: Coordinate geografiche [longitudine, latitudine]
 *               minItems: 2
 *               maxItems: 2
 *               items:
 *                 type: number
 *                 format: double
 *               example: [12.4964, 41.9028]
 *         address:
 *           type: string
 *           description: Indirizzo leggibile della segnalazione
 *           example: "Via Roma 123, 00100 Roma RM"
 *         type:
 *           type: string
 *           description: |
 *             Categoria del problema segnalato:
 *             - **RIFIUTI_ABBANDONATI**: Rifiuti abbandonati per strada
 *             - **AREA_SPORCA**: Area che necessita pulizia
 *             - **PROBLEMA_CESTINO**: Cestino danneggiato o malfunzionante
 *             - **RACCOLTA_SALTATA**: Raccolta rifiuti non effettuata
 *             - **VANDALISMO**: Atti di vandalismo a strutture pubbliche
 *             - **SCARICO_ILLEGALE**: Scarico illegale di rifiuti
 *             - **ALTRO**: Altri problemi legati ai rifiuti
 *           enum: [RIFIUTI_ABBANDONATI, AREA_SPORCA, PROBLEMA_CESTINO, RACCOLTA_SALTATA, VANDALISMO, SCARICO_ILLEGALE, ALTRO]
 *           example: "PROBLEMA_CESTINO"
 *         status:
 *           type: string
 *           description: |
 *             Stato corrente della segnalazione:
 *             - **IN_ATTESA**: Appena creata, in attesa di verifica
 *             - **VERIFICATO**: Confermata dal personale comunale
 *             - **IN_LAVORAZIONE**: Intervento in corso di esecuzione
 *             - **RISOLTO**: Problema risolto con successo
 *             - **RIFIUTATO**: Segnalazione respinta
 *             - **PROGRAMMATO**: Intervento programmato
 *           enum: [IN_ATTESA, VERIFICATO, IN_LAVORAZIONE, RISOLTO, RIFIUTATO, PROGRAMMATO]
 *           default: IN_ATTESA
 *           example: "IN_ATTESA"
 *         images:
 *           type: array
 *           description: URL delle immagini allegate alla segnalazione
 *           maxItems: 5
 *           items:
 *             type: string
 *             format: uri
 *             description: URL dell'immagine
 *           example: ["https://api.minustrash.com/images/report123_1.jpg"]
 *         urgency:
 *           type: string
 *           description: |
 *             Livello di urgenza della segnalazione:
 *             - **BASSA**: Problema non urgente
 *             - **MEDIA**: Richiede attenzione nei prossimi giorni
 *             - **ALTA**: Richiede intervento prioritario
 *             - **URGENTE**: Richiede intervento immediato
 *           enum: [BASSA, MEDIA, ALTA, URGENTE]
 *           default: MEDIA
 *           example: "MEDIA"
 *         reportedBy:
 *           type: string
 *           description: ID dell'utente che ha creato la segnalazione
 *           example: "507f1f77bcf86cd799439011"
 *         assignedTo:
 *           type: string
 *           description: ID dell'operatore comunale assegnato
 *           example: "507f1f77bcf86cd799439013"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data e ora di creazione della segnalazione
 *           example: "2023-12-01T10:15:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data e ora ultimo aggiornamento
 *           example: "2023-12-01T15:30:00Z"
 *       example:
 *         title: "Cestino pieno in Via Roma"
 *         description: "Il cestino è completamente pieno e i rifiuti traboccano"
 *         type: "PROBLEMA_CESTINO"
 *         urgency: "MEDIA"
 *         location:
 *           type: "Point"
 *           coordinates: [12.4964, 41.9028]
 *         address: "Via Roma 123, 00100 Roma RM"
 *     
 *     Bin:
 *       title: Bin
 *       description: Cestino pubblico per la raccolta differenziata dei rifiuti
 *       type: object
 *       required:
 *         - location
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           description: ID univoco del cestino
 *           example: "507f1f77bcf86cd799439014"
 *         location:
 *           type: object
 *           description: Posizione geografica del cestino (formato GeoJSON)
 *           required:
 *             - type
 *             - coordinates
 *           properties:
 *             type:
 *               type: string
 *               enum: [Point]
 *               default: Point
 *               description: Tipo di geometria (sempre Point)
 *               example: "Point"
 *             coordinates:
 *               type: array
 *               description: Coordinate geografiche [longitudine, latitudine]
 *               minItems: 2
 *               maxItems: 2
 *               items:
 *                 type: number
 *                 format: double
 *               example: [12.4964, 41.9028]
 *         address:
 *           type: string
 *           description: Indirizzo leggibile del cestino
 *           example: "Via Roma 45, 00100 Roma RM"
 *         type:
 *           type: string
 *           description: |
 *             Tipo di raccolta del cestino:
 *             - **INDIFFERENZIATO**: Rifiuti non differenziabili
 *             - **CARTA**: Carta e cartone
 *             - **PLASTICA**: Plastica e metalli
 *             - **VETRO**: Vetro e materiali vetrosi
 *             - **ORGANICO**: Rifiuti organici compostabili
 *             - **RAEE**: Rifiuti di apparecchiature elettriche ed elettroniche
 *             - **ALTRO**: Altri tipi di rifiuti
 *           enum: [INDIFFERENZIATO, CARTA, PLASTICA, VETRO, ORGANICO, RAEE, ALTRO]
 *           example: "INDIFFERENZIATO"
 *         status:
 *           type: string
 *           description: |
 *             Stato operativo del cestino:
 *             - **ATTIVO**: Funzionante e utilizzabile
 *             - **MANUTENZIONE**: In manutenzione programmata
 *             - **INATTIVO**: Non utilizzabile o rimosso
 *           enum: [ATTIVO, MANUTENZIONE, INATTIVO]
 *           default: ATTIVO
 *           example: "ATTIVO"
 *         capacity:
 *           type: number
 *           description: Capacità massima del cestino in litri
 *           minimum: 1
 *           maximum: 1000
 *           example: 120
 *         fillLevel:
 *           type: number
 *           description: Livello di riempimento attuale (percentuale 0-100)
 *           minimum: 0
 *           maximum: 100
 *           example: 75
 *         lastEmptied:
 *           type: string
 *           format: date-time
 *           description: Data e ora dell'ultimo svuotamento
 *           example: "2023-11-30T08:00:00Z"
 *         zone:
 *           type: string
 *           description: Zona o quartiere di appartenenza
 *           example: "Centro Storico"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data di installazione del cestino
 *           example: "2023-01-15T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data ultimo aggiornamento
 *           example: "2023-12-01T15:30:00Z"
 *       example:
 *         location:
 *           type: "Point"
 *           coordinates: [12.4964, 41.9028]
 *         address: "Via Roma 45, 00100 Roma RM"
 *         type: "INDIFFERENZIATO"
 *         status: "ATTIVO"
 *         capacity: 120
 *         fillLevel: 75
 *         zone: "Centro Storico"
 */

/**
 * @swagger
 * tags:
 *   name: Segnalazioni
 *   description: |
 *     Creazione e gestione delle segnalazioni di problemi legati ai rifiuti.
 *     Include abbandoni, aree sporche, problemi ai cestini e molto altro.
 */

/**
 * @swagger
 * tags:
 *   name: Cestini
 *   description: |
 *     Gestione dei cestini pubblici, monitoraggio del loro stato
 *     e livello di riempimento in tempo reale.
 */

//Reports Routes (Segnalazioni)
//BASE PATH: /api/reports

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Elenca tutte le segnalazioni
 *     description: |
 *       Recupera l'elenco di tutte le segnalazioni presenti nel sistema.
 *       
 *       **Filtri disponibili:**
 *       - Filtra per stato (IN_ATTESA, VERIFICATO, IN_LAVORAZIONE, RISOLTO, etc.)
 *       - Filtra per tipo (RIFIUTI_ABBANDONATI, PROBLEMA_CESTINO, etc.)
 *       - Filtra per urgenza (BASSA, MEDIA, ALTA, URGENTE)
 *       - Filtra per zona geografica
 *       
 *       **Permessi richiesti:**
 *       - **Cittadino**: Vede solo le proprie segnalazioni
 *       - **Operatore**: Vede le segnalazioni della propria zona
 *       - **Amministratore**: Vede tutte le segnalazioni
 *     tags: [Segnalazioni]
 *     operationId: getAllReports
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Numero di pagina (inizia da 1)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *       - name: limit
 *         in: query
 *         description: Numero di elementi per pagina
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *           example: 20
 *       - name: status
 *         in: query
 *         description: Filtra per stato della segnalazione
 *         schema:
 *           type: string
 *           enum: [IN_ATTESA, VERIFICATO, IN_LAVORAZIONE, RISOLTO, RIFIUTATO, PROGRAMMATO]
 *           example: "IN_ATTESA"
 *       - name: type
 *         in: query
 *         description: Filtra per tipo di segnalazione
 *         schema:
 *           type: string
 *           enum: [RIFIUTI_ABBANDONATI, AREA_SPORCA, PROBLEMA_CESTINO, RACCOLTA_SALTATA, VANDALISMO, SCARICO_ILLEGALE, ALTRO]
 *           example: "PROBLEMA_CESTINO"
 *       - name: urgency
 *         in: query
 *         description: Filtra per livello di urgenza
 *         schema:
 *           type: string
 *           enum: [BASSA, MEDIA, ALTA, URGENTE]
 *           example: "ALTA"
 *       - name: zone
 *         in: query
 *         description: Filtra per zona/quartiere
 *         schema:
 *           type: string
 *           example: "Centro Storico"
 *     responses:
 *       200:
 *         description: Lista di segnalazioni recuperata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Report'
 *             examples:
 *               success:
 *                 summary: Lista segnalazioni
 *                 value:
 *                   - _id: "507f1f77bcf86cd799439012"
 *                     title: "Cestino pieno in Via Roma"
 *                     description: "Il cestino è completamente pieno"
 *                     type: "PROBLEMA_CESTINO"
 *                     status: "IN_ATTESA"
 *                     urgency: "MEDIA"
 *                     location:
 *                       type: "Point"
 *                       coordinates: [12.4964, 41.9028]
 *                     createdAt: "2023-12-01T10:15:00Z"
 *                   - _id: "507f1f77bcf86cd799439013"
 *                     title: "Rifiuti abbandonati nel parco"
 *                     description: "Sacchi di spazzatura vicino alla panchina"
 *                     type: "RIFIUTI_ABBANDONATI"
 *                     status: "VERIFICATO"
 *                     urgency: "ALTA"
 *                     location:
 *                       type: "Point"
 *                       coordinates: [12.4970, 41.9025]
 *                     createdAt: "2023-12-01T09:30:00Z"
 *       401:
 *         description: Token di autenticazione mancante o non valido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Token richiesto"
 *       403:
 *         description: Permessi insufficienti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Accesso negato"
 *   post:
 *     summary: Crea una nuova segnalazione
 *     description: |
 *       Crea una nuova segnalazione di problema legato ai rifiuti.
 *       
 *       **Informazioni richieste:**
 *       - Titolo descrittivo del problema
 *       - Descrizione dettagliata
 *       - Posizione geografica (coordinate GPS)
 *       - Tipo di problema
 *       - Opzionalmente: immagini, livello di urgenza
 *       
 *       **Note:**
 *       - Le coordinate devono essere nel formato [longitudine, latitudine]
 *       - È possibile allegare fino a 5 immagini
 *       - Lo stato iniziale sarà sempre "IN_ATTESA"
 *       - L'urgenza predefinita è "MEDIA"
 *     tags: [Segnalazioni]
 *     operationId: createReport
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       description: Dati della nuova segnalazione
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - location
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 100
 *                 example: "Cestino danneggiato in Piazza Garibaldi"
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 example: "Il cestino ha un buco sul lato e i rifiuti escono"
 *               location:
 *                 type: object
 *                 required:
 *                   - coordinates
 *                 properties:
 *                   coordinates:
 *                     type: array
 *                     minItems: 2
 *                     maxItems: 2
 *                     items:
 *                       type: number
 *                     example: [12.4965, 41.9030]
 *               address:
 *                 type: string
 *                 example: "Piazza Garibaldi 1, 00100 Roma RM"
 *               type:
 *                 type: string
 *                 enum: [RIFIUTI_ABBANDONATI, AREA_SPORCA, PROBLEMA_CESTINO, RACCOLTA_SALTATA, VANDALISMO, SCARICO_ILLEGALE, ALTRO]
 *                 example: "PROBLEMA_CESTINO"
 *               images:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: uri
 *                 example: ["https://example.com/image1.jpg"]
 *               urgency:
 *                 type: string
 *                 enum: [BASSA, MEDIA, ALTA, URGENTE]
 *                 default: MEDIA
 *                 example: "ALTA"
 *           examples:
 *             problema_cestino:
 *               summary: Segnalazione cestino danneggiato
 *               value:
 *                 title: "Cestino danneggiato in Piazza Garibaldi"
 *                 description: "Il cestino ha un buco sul lato e i rifiuti escono"
 *                 type: "PROBLEMA_CESTINO"
 *                 urgency: "ALTA"
 *                 location:
 *                   coordinates: [12.4965, 41.9030]
 *                 address: "Piazza Garibaldi 1, 00100 Roma RM"
 *                 images: ["https://example.com/cestino_rotto.jpg"]
 *             rifiuti_abbandonati:
 *               summary: Segnalazione rifiuti abbandonati
 *               value:
 *                 title: "Rifiuti abbandonati nel parco"
 *                 description: "Sacchi di spazzatura abbandonati vicino alla panchina principale"
 *                 type: "RIFIUTI_ABBANDONATI"
 *                 urgency: "MEDIA"
 *                 location:
 *                   coordinates: [12.4970, 41.9025]
 *                 address: "Parco della Rimembranza, 00100 Roma RM"
 *     responses:
 *       201:
 *         description: Segnalazione creata con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *             examples:
 *               success:
 *                 summary: Segnalazione creata
 *                 value:
 *                   _id: "507f1f77bcf86cd799439012"
 *                   title: "Cestino danneggiato in Piazza Garibaldi"
 *                   description: "Il cestino ha un buco sul lato e i rifiuti escono"
 *                   type: "PROBLEMA_CESTINO"
 *                   status: "IN_ATTESA"
 *                   urgency: "ALTA"
 *                   location:
 *                     type: "Point"
 *                     coordinates: [12.4965, 41.9030]
 *                   address: "Piazza Garibaldi 1, 00100 Roma RM"
 *                   images: ["https://example.com/cestino_rotto.jpg"]
 *                   reportedBy: "507f1f77bcf86cd799439011"
 *                   createdAt: "2023-12-01T15:30:00Z"
 *       400:
 *         description: Dati della segnalazione non validi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Dati non validi"
 *                 message:
 *                   type: string
 *                   example: "Il titolo deve essere lungo almeno 5 caratteri"
 *       401:
 *         description: Token di autenticazione mancante o non valido
 *       429:
 *         description: Troppo molte richieste - Rate limit superato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Rate limit superato"
 *                 message:
 *                   type: string
 *                   example: "Puoi creare massimo 5 segnalazioni all'ora"
 */
router.route('/reports')
    .get(jwtAuth, reportController.getAllReports) //GET /reports - Lista tutte le segnalazioni
    .post(jwtAuth, reportController.reportLimiter, validateWasteReport, reportController.createReport); //POST /reports - Crea nuova segnalazione

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Recupera una segnalazione per ID
 *     description: Ottiene i dettagli di una singola segnalazione tramite il suo ID univoco
 *     tags: [Segnalazioni]
 *     operationId: getReportById
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID univoco della segnalazione
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Dettaglio della segnalazione recuperato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       404:
 *         description: Segnalazione non trovata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Segnalazione non trovata"
 *       401:
 *         description: Token di autenticazione richiesto
 *   patch:
 *     summary: Aggiorna una segnalazione
 *     description: |
 *       Aggiorna i dati di una segnalazione esistente.
 *       Solo il creatore della segnalazione o un operatore/amministratore può modificarla.
 *     tags: [Segnalazioni]
 *     operationId: updateReport
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID univoco della segnalazione da aggiornare
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *     requestBody:
 *       description: Dati aggiornati della segnalazione
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *               urgency:
 *                 type: string
 *                 enum: [BASSA, MEDIA, ALTA, URGENTE]
 *               images:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: uri
 *           example:
 *             title: "Cestino completamente distrutto"
 *             description: "Il cestino è stato vandalizzato e non è più utilizzabile"
 *             urgency: "URGENTE"
 *     responses:
 *       200:
 *         description: Segnalazione aggiornata con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Dati di aggiornamento non validi
 *       401:
 *         description: Token di autenticazione richiesto
 *       403:
 *         description: Non autorizzato a modificare questa segnalazione
 *       404:
 *         description: Segnalazione non trovata
 *   delete:
 *     summary: Elimina una segnalazione
 *     description: |
 *       Elimina definitivamente una segnalazione dal sistema.
 *       Solo il creatore della segnalazione o un amministratore può eliminarla.
 *     tags: [Segnalazioni]
 *     operationId: deleteReport
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID univoco della segnalazione da eliminare
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Segnalazione eliminata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Segnalazione eliminata con successo"
 *       401:
 *         description: Token di autenticazione richiesto
 *       403:
 *         description: Non autorizzato a eliminare questa segnalazione
 *       404:
 *         description: Segnalazione non trovata
 */
router.route('/reports/:id')
    .get(jwtAuth, reportController.getReportById)//GET /reports/:id - Dettaglio segnalazione
    .patch(jwtAuth, validateWasteReport, reportController.updateReport) //PATCH /reports/:id - Aggiorna segnalazione
    .delete(jwtAuth, reportController.deleteReport);//DELETE /reports/:id - Elimina segnalazione

/**
 * @swagger
 * /api/reports/{id}/status:
 *   patch:
 *     summary: Aggiorna lo stato di una segnalazione
 *     description: |
 *       Modifica lo stato di una segnalazione esistente.
 *       
 *       **Permessi richiesti:**
 *       - **Operatore comunale**: Può modificare le segnalazioni della propria zona
 *       - **Amministratore**: Può modificare qualsiasi segnalazione
 *       - **Cittadino**: Non può modificare gli stati (solo creare segnalazioni)
 *       
 *       **Stati disponibili:**
 *       - **IN_ATTESA**: Segnalazione appena creata, in attesa di verifica
 *       - **VERIFICATO**: Confermata dal personale, problema reale
 *       - **IN_LAVORAZIONE**: Intervento attualmente in corso
 *       - **RISOLTO**: Problema risolto con successo
 *       - **RIFIUTATO**: Segnalazione non valida o duplicata
 *       - **PROGRAMMATO**: Intervento programmato per una data futura
 *    
 *       **Note operative:**
 *       - Il cambio di stato viene tracciato nei log
 *       - L'utente che ha creato la segnalazione riceve notifiche
 *       - Alcuni stati richiedono informazioni aggiuntive (note, data programmata)
 *     tags: [Segnalazioni]
 *     operationId: updateReportStatus
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID univoco della segnalazione
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *     requestBody:
 *       description: Nuovo stato e informazioni aggiuntive
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
 *                 description: Nuovo stato della segnalazione
 *                 enum: [IN_ATTESA, VERIFICATO, IN_LAVORAZIONE, RISOLTO, RIFIUTATO, PROGRAMMATO]
 *                 example: "VERIFICATO"
 *               notes:
 *                 type: string
 *                 description: Note dell'operatore (opzionali ma consigliate)
 *                 maxLength: 500
 *                 example: "Verificato sul posto, il cestino è effettivamente danneggiato"
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *                 description: Data programmata per l'intervento (richiesta se status = PROGRAMMATO)
 *                 example: "2023-12-05T09:00:00Z"
 *               assignedTo:
 *                 type: string
 *                 description: ID dell'operatore assegnato all'intervento
 *                 example: "507f1f77bcf86cd799439013"
 *           examples:
 *             verify_report:
 *               summary: Verifica segnalazione
 *               value:
 *                 status: "VERIFICATO"
 *                 notes: "Confermato il problema sul posto, necessario intervento"
 *                 assignedTo: "507f1f77bcf86cd799439013"
 *             start_work:
 *               summary: Inizia lavorazione
 *               value:
 *                 status: "IN_LAVORAZIONE"
 *                 notes: "Squadra tecnica inviata sul posto"
 *             schedule_work:
 *               summary: Programma intervento
 *               value:
 *                 status: "PROGRAMMATO"
 *                 notes: "Intervento programmato per lunedì mattina"
 *                 scheduledDate: "2023-12-05T09:00:00Z"
 *                 assignedTo: "507f1f77bcf86cd799439013"
 *             resolve_report:
 *               summary: Risolvi segnalazione
 *               value:
 *                 status: "RISOLTO"
 *                 notes: "Cestino riparato e ripristinato il servizio"
 *             reject_report:
 *               summary: Rifiuta segnalazione
 *               value:
 *                 status: "RIFIUTATO"
 *                 notes: "Segnalazione duplicata, già risolta in ticket #123"
 *     responses:
 *       200:
 *         description: Stato aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Stato segnalazione aggiornato con successo"
 *                 report:
 *                   $ref: '#/components/schemas/Report'
 *                 statusHistory:
 *                   type: array
 *                   description: Cronologia dei cambi di stato
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       changedBy:
 *                         type: string
 *                       changedAt:
 *                         type: string
 *                         format: date-time
 *                       notes:
 *                         type: string
 *             examples:
 *               success:
 *                 summary: Stato aggiornato
 *                 value:
 *                   message: "Stato segnalazione aggiornato con successo"
 *                   report:
 *                     _id: "507f1f77bcf86cd799439012"
 *                     title: "Cestino danneggiato in Piazza Garibaldi"
 *                     status: "VERIFICATO"
 *                     assignedTo: "507f1f77bcf86cd799439013"
 *                     updatedAt: "2023-12-01T16:15:00Z"
 *                   statusHistory:
 *                     - status: "IN_ATTESA"
 *                       changedBy: "507f1f77bcf86cd799439011"
 *                       changedAt: "2023-12-01T10:15:00Z"
 *                       notes: "Segnalazione creata"
 *                     - status: "VERIFICATO"
 *                       changedBy: "507f1f77bcf86cd799439013"
 *                       changedAt: "2023-12-01T16:15:00Z"
 *                       notes: "Confermato il problema sul posto"
 *       400:
 *         description: Dati non validi o transizione di stato non permessa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Transizione non valida"
 *                 message:
 *                   type: string
 *                   example: "Non è possibile passare da RISOLTO a IN_ATTESA"
 *       401:
 *         description: Token di autenticazione richiesto
 *       403:
 *         description: Permessi insufficienti per modificare questa segnalazione
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Accesso negato"
 *                 message:
 *                   type: string
 *                   example: "Solo operatori e amministratori possono modificare lo stato delle segnalazioni"
 *       404:
 *         description: Segnalazione non trovata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Segnalazione non trovata"
 */
//Report Status Management
router.route('/reports/:id/status')
    .patch(jwtAuth, reportController.updateReportStatus); //PATCH /reports/:id/status - Aggiorna stato

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
//BASE PATH: /api/bins

/**
 * @swagger
 * /api/bins:
 *   get:
 *     summary: Recupera tutti i cestini
 *     description: |
 *       Ottiene l'elenco di tutti i cestini pubblici presenti nel sistema.
 *       Include informazioni su posizione, tipo di raccolta, stato operativo e livello di riempimento.
 *       
 *       **Filtri disponibili tramite query parameters:**
 *       - Per tipo di raccolta (INDIFFERENZIATO, CARTA, PLASTICA, etc.)
 *       - Per stato (ATTIVO, MANUTENZIONE, INATTIVO)
 *       - Per zona geografica
 *       - Per livello di riempimento
 *     tags: [Cestini]
 *     operationId: getAllBins
 *     parameters:
 *       - name: type
 *         in: query
 *         description: Filtra per tipo di raccolta
 *         schema:
 *           type: string
 *           enum: [INDIFFERENZIATO, CARTA, PLASTICA, VETRO, ORGANICO, RAEE, ALTRO]
 *           example: "INDIFFERENZIATO"
 *       - name: status
 *         in: query
 *         description: Filtra per stato operativo
 *         schema:
 *           type: string
 *           enum: [ATTIVO, MANUTENZIONE, INATTIVO]
 *           example: "ATTIVO"
 *       - name: zone
 *         in: query
 *         description: Filtra per zona/quartiere
 *         schema:
 *           type: string
 *           example: "Centro Storico"
 *       - name: fillLevel
 *         in: query
 *         description: Filtra per livello di riempimento minimo
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           example: 80
 *     responses:
 *       200:
 *         description: Lista di cestini recuperata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bin'
 *             examples:
 *               success:
 *                 summary: Lista cestini
 *                 value:
 *                   - _id: "507f1f77bcf86cd799439014"
 *                     location:
 *                       type: "Point"
 *                       coordinates: [12.4964, 41.9028]
 *                     address: "Via Roma 45, 00100 Roma RM"
 *                     type: "INDIFFERENZIATO"
 *                     status: "ATTIVO"
 *                     capacity: 120
 *                     fillLevel: 75
 *                     zone: "Centro Storico"
 *                   - _id: "507f1f77bcf86cd799439015"
 *                     location:
 *                       type: "Point"
 *                       coordinates: [12.4970, 41.9025]
 *                     address: "Piazza Garibaldi 1, 00100 Roma RM"
 *                     type: "CARTA"
 *                     status: "ATTIVO"
 *                     capacity: 100
 *                     fillLevel: 95
 *                     zone: "Centro Storico"
 *   post:
 *     summary: Crea nuovo cestino
 *     description: |
 *       Aggiunge un nuovo cestino pubblico al sistema.
 *       Richiede privilegi di operatore comunale o amministratore.
 *       
 *       **Informazioni richieste:**
 *       - Posizione geografica (coordinate GPS)
 *       - Tipo di raccolta
 *       - Capacità in litri
 *       - Zona di appartenenza
 *     tags: [Cestini]
 *     operationId: createBin
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       description: Dati del nuovo cestino
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *               - type
 *               - capacity
 *             properties:
 *               location:
 *                 type: object
 *                 required:
 *                   - coordinates
 *                 properties:
 *                   coordinates:
 *                     type: array
 *                     minItems: 2
 *                     maxItems: 2
 *                     items:
 *                       type: number
 *                     example: [12.4980, 41.9035]
 *               address:
 *                 type: string
 *                 example: "Via Nazionale 10, 00100 Roma RM"
 *               type:
 *                 type: string
 *                 enum: [INDIFFERENZIATO, CARTA, PLASTICA, VETRO, ORGANICO, RAEE, ALTRO]
 *                 example: "PLASTICA"
 *               capacity:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 1000
 *                 example: 150
 *               zone:
 *                 type: string
 *                 example: "Centro Storico"
 *           examples:
 *             nuovo_cestino:
 *               summary: Nuovo cestino plastica
 *               value:
 *                 location:
 *                   coordinates: [12.4980, 41.9035]
 *                 address: "Via Nazionale 10, 00100 Roma RM"
 *                 type: "PLASTICA"
 *                 capacity: 150
 *                 zone: "Centro Storico"
 *     responses:
 *       201:
 *         description: Cestino creato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bin'
 *             examples:
 *               success:
 *                 summary: Cestino creato
 *                 value:
 *                   _id: "507f1f77bcf86cd799439016"
 *                   location:
 *                     type: "Point"
 *                     coordinates: [12.4980, 41.9035]
 *                   address: "Via Nazionale 10, 00100 Roma RM"
 *                   type: "PLASTICA"
 *                   status: "ATTIVO"
 *                   capacity: 150
 *                   fillLevel: 0
 *                   zone: "Centro Storico"
 *                   createdAt: "2023-12-01T16:00:00Z"
 *       400:
 *         description: Dati del cestino non validi
 *       401:
 *         description: Token di autenticazione richiesto
 *       403:
 *         description: Privilegi insufficienti - Solo operatori e amministratori
 */
router.route('/bins')
    .get(binController.getAllBins)//GET /bins - Lista tutti i cestini
    .post(jwtAuth, validateBin, binController.createBin);//POST /bins - Crea nuovo cestino

//Bin Filters
router.get('/bins/area', binController.getBinsInArea);//GET /bins/area?lat=x&lng=y - Cestini in area
router.get('/bins/type/:type', binController.getBinsByType);//GET /bins/type/:type - Filtra per tipo
router.get('/bins/maintenance', jwtAuth, binController.getBinsNeedingMaintenance); //GET /bins/maintenance - Cestini da manutenere

/**
 * @swagger
 * /api/bins/{id}:
 *   get:
 *     summary: Recupera cestino per ID
 *     description: |
 *       Ottiene i dettagli completi di un cestino specifico tramite il suo ID univoco.
 *       
 *       **Informazioni fornite:**
 *       - Posizione geografica e indirizzo
 *       - Tipo di raccolta e capacità
 *       - Stato operativo attuale
 *       - Livello di riempimento in tempo reale
 *       - Cronologia manutenzioni e svuotamenti
 *       - Zona di appartenenza
 *       
 *       **Accessibilità:**
 *       - Endpoint pubblico (non richiede autenticazione)
 *       - Utilizzabile per app mobile e web
 *       - Ottimo per mappe interattive
 *     tags: [Cestini]
 *     operationId: getBinById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID univoco del cestino
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439014"
 *     responses:
 *       200:
 *         description: Dettagli del cestino recuperati con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bin'
 *             examples:
 *               active_bin:
 *                 summary: Cestino attivo
 *                 value:
 *                   _id: "507f1f77bcf86cd799439014"
 *                   location:
 *                     type: "Point"
 *                     coordinates: [12.4964, 41.9028]
 *                   address: "Via Roma 45, 00100 Roma RM"
 *                   type: "INDIFFERENZIATO"
 *                   status: "ATTIVO"
 *                   capacity: 120
 *                   fillLevel: 75
 *                   lastEmptied: "2023-11-30T08:00:00Z"
 *                   zone: "Centro Storico"
 *                   createdAt: "2023-01-15T10:00:00Z"
 *       404:
 *         description: Cestino non trovato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Cestino non trovato"
 *                 message:
 *                   type: string
 *                   example: "Nessun cestino trovato con l'ID specificato"
 *   patch:
 *     summary: Aggiorna cestino
 *     description: |
 *       Modifica i dati di un cestino esistente.
 *       
 *       **🔐 Richiede autenticazione e privilegi di operatore/amministratore**
 *       
 *       **Campi modificabili:**
 *       - Posizione geografica (se il cestino viene spostato)
 *       - Capacità (se viene sostituito con un modello diverso)
 *       - Livello di riempimento (aggiornamento manuale)
 *       - Zona di appartenenza
 *       - Tipo di raccolta (se cambia destinazione d'uso)
 *       
 *       **Campi NON modificabili:**
 *       - ID del cestino
 *       - Data di creazione
 *       - Stato (usa endpoint dedicato `/status`)
 *       
 *       **Use Cases:**
 *       - Aggiornamento dati dopo manutenzione
 *       - Correzione informazioni errate
 *       - Cambio tipo di raccolta
 *       - Spostamento fisico del cestino
 *     tags: [Cestini]
 *     operationId: updateBin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID univoco del cestino da aggiornare
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439014"
 *     requestBody:
 *       description: Dati del cestino da aggiornare
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 type: object
 *                 properties:
 *                   coordinates:
 *                     type: array
 *                     minItems: 2
 *                     maxItems: 2
 *                     items:
 *                       type: number
 *                     example: [12.4965, 41.9029]
 *               address:
 *                 type: string
 *                 example: "Via Roma 47, 00100 Roma RM"
 *               type:
 *                 type: string
 *                 enum: [INDIFFERENZIATO, CARTA, PLASTICA, VETRO, ORGANICO, RAEE, ALTRO]
 *                 example: "CARTA"
 *               capacity:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 1000
 *                 example: 150
 *               fillLevel:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 0
 *               zone:
 *                 type: string
 *                 example: "Centro Storico"
 *           examples:
 *             update_location:
 *               summary: Aggiorna posizione
 *               value:
 *                 location:
 *                   coordinates: [12.4965, 41.9029]
 *                 address: "Via Roma 47, 00100 Roma RM"
 *             change_type:
 *               summary: Cambia tipo raccolta
 *               value:
 *                 type: "CARTA"
 *                 capacity: 100
 *             update_fill:
 *               summary: Aggiorna riempimento
 *               value:
 *                 fillLevel: 0
 *     responses:
 *       200:
 *         description: Cestino aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cestino aggiornato con successo"
 *                 bin:
 *                   $ref: '#/components/schemas/Bin'
 *             examples:
 *               success:
 *                 summary: Aggiornamento riuscito
 *                 value:
 *                   message: "Cestino aggiornato con successo"
 *                   bin:
 *                     _id: "507f1f77bcf86cd799439014"
 *                     location:
 *                       type: "Point"
 *                       coordinates: [12.4965, 41.9029]
 *                     address: "Via Roma 47, 00100 Roma RM"
 *                     type: "CARTA"
 *                     status: "ATTIVO"
 *                     capacity: 100
 *                     fillLevel: 0
 *                     updatedAt: "2023-12-01T17:30:00Z"
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Token di autenticazione richiesto
 *       403:
 *         description: Privilegi insufficienti - Solo operatori e amministratori
 *       404:
 *         description: Cestino non trovato
 *   delete:
 *     summary: Elimina cestino
 *     description: |
 *       Rimuove definitivamente un cestino dal sistema.
 *       
 *       **Richiede privilegi di amministratore**
 *       
 *          **OPERAZIONE IRREVERSIBILE**
 *       
 *       **Quando utilizzare:**
 *       - Cestino fisicamente rimosso
 *       - Cestino non più utilizzabile
 *       - Errore nella creazione (duplicato)
 *       
 *       **Effetti collaterali:**
 *       - Tutte le segnalazioni associate vengono archiviate
 *       - I dati storici vengono mantenuti per audit
 *       - Le statistiche vengono aggiornate
 *       
 *       **Alternative consigliate:**
 *       - Usa stato "INATTIVO" invece di eliminare
 *       - Mantieni i dati per analisi storiche
 *     tags: [Cestini]
 *     operationId: deleteBin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID univoco del cestino da eliminare
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439014"
 *     responses:
 *       200:
 *         description: Cestino eliminato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cestino eliminato con successo"
 *                 deletedBin:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439014"
 *                     address:
 *                       type: string
 *                       example: "Via Roma 45, 00100 Roma RM"
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-12-01T17:45:00Z"
 *             examples:
 *               success:
 *                 summary: Eliminazione riuscita
 *                 value:
 *                   message: "Cestino eliminato con successo"
 *                   deletedBin:
 *                     _id: "507f1f77bcf86cd799439014"
 *                     address: "Via Roma 45, 00100 Roma RM"
 *                     deletedAt: "2023-12-01T17:45:00Z"
 *       401:
 *         description: Token di autenticazione richiesto
 *       403:
 *         description: Privilegi insufficienti - Solo amministratori
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Accesso negato"
 *                 message:
 *                   type: string
 *                   example: "Solo gli amministratori possono eliminare i cestini"
 *       404:
 *         description: Cestino non trovato
 */
router.route('/bins/:id')
    .get(binController.getBinById)//GET /bins/:id - Dettaglio cestino
    .patch(jwtAuth, validateBin, binController.updateBin)//PATCH /bins/:id - Aggiorna cestino
    .delete(jwtAuth, binController.deleteBin);//DELETE /bins/:id - Elimina cestino

//Bin Status Management
/**
 * @swagger
 * /api/bins/{id}/status:
 *   patch:
 *     summary: Aggiorna stato cestino
 *     description: |
 *       Modifica lo stato operativo di un cestino pubblico.
 *       
 *       **Richiede privilegi di operatore comunale o amministratore**
 *       
 *       **Stati disponibili:**
 *       - **ATTIVO**: Cestino funzionante e utilizzabile dal pubblico
 *       - **MANUTENZIONE**: Cestino temporaneamente fuori servizio per manutenzione
 *       - **INATTIVO**: Cestino definitivamente disattivato o rimosso
 *       
 *       **Workflow tipico:**
 *       ATTIVO ↔ MANUTENZIONE (per interventi temporanei)
 *       ATTIVO → INATTIVO (per disattivazione definitiva)
 *       
 *       **Effetti del cambio stato:**
 *       - **MANUTENZIONE**: Il cestino non appare nelle ricerche pubbliche
 *       - **INATTIVO**: Le notifiche di riempimento vengono disabilitate
 *       - **ATTIVO**: Riprende il monitoraggio e la visibilità pubblica
 *       
 *       **Use Cases:**
 *       - Manutenzione programmata o straordinaria
 *       - Guasto temporaneo o danneggiamento
 *       - Disattivazione per rimozione definitiva
 *       - Riattivazione dopo riparazione/sostituzione
 *     tags: [Cestini]
 *     operationId: updateBinStatus
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID univoco del cestino
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439014"
 *     requestBody:
 *       description: Nuovo stato del cestino e informazioni aggiuntive
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
 *                 description: Nuovo stato operativo del cestino
 *                 enum: [ATTIVO, MANUTENZIONE, INATTIVO]
 *                 example: "MANUTENZIONE"
 *               reason:
 *                 type: string
 *                 description: Motivo del cambio di stato (opzionale ma consigliato)
 *                 maxLength: 200
 *                 example: "Cestino danneggiato da atti vandalici, necessaria sostituzione"
 *               estimatedDuration:
 *                 type: string
 *                 description: Durata stimata per MANUTENZIONE (formato ISO 8601 duration)
 *                 pattern: "^P(?!$)(\\d+Y)?(\\d+M)?(\\d+W)?(\\d+D)?(T(?=\\d)(\\d+H)?(\\d+M)?(\\d+S)?)?$"
 *                 example: "P2D"
 *               scheduledReactivation:
 *                 type: string
 *                 format: date-time
 *                 description: Data programmata per riattivazione (per stato MANUTENZIONE)
 *                 example: "2023-12-05T08:00:00Z"
 *               maintenanceType:
 *                 type: string
 *                 description: Tipo di manutenzione (se status = MANUTENZIONE)
 *                 enum: [PROGRAMMATA, STRAORDINARIA, GUASTO, VANDALISMO, SOSTITUZIONE]
 *                 example: "STRAORDINARIA"
 *           examples:
 *             maintenance_scheduled:
 *               summary: Manutenzione programmata
 *               value:
 *                 status: "MANUTENZIONE"
 *                 reason: "Manutenzione programmata settimanale"
 *                 maintenanceType: "PROGRAMMATA"
 *                 estimatedDuration: "P1D"
 *                 scheduledReactivation: "2023-12-03T08:00:00Z"
 *             emergency_repair:
 *               summary: Riparazione urgente
 *               value:
 *                 status: "MANUTENZIONE"
 *                 reason: "Cestino danneggiato da atti vandalici"
 *                 maintenanceType: "STRAORDINARIA"
 *                 estimatedDuration: "P3D"
 *             deactivate_permanently:
 *               summary: Disattivazione definitiva
 *               value:
 *                 status: "INATTIVO"
 *                 reason: "Cestino rimosso per ristrutturazione area"
 *             reactivate_after_repair:
 *               summary: Riattivazione dopo riparazione
 *               value:
 *                 status: "ATTIVO"
 *                 reason: "Riparazione completata, cestino nuovamente operativo"
 *     responses:
 *       200:
 *         description: Stato del cestino aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Stato cestino aggiornato con successo"
 *                 bin:
 *                   $ref: '#/components/schemas/Bin'
 *                 statusHistory:
 *                   type: array
 *                   description: Cronologia dei cambi di stato
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                         example: "MANUTENZIONE"
 *                       changedBy:
 *                         type: string
 *                         description: ID dell'operatore che ha effettuato il cambio
 *                         example: "507f1f77bcf86cd799439013"
 *                       changedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-12-01T18:00:00Z"
 *                       reason:
 *                         type: string
 *                         example: "Manutenzione programmata settimanale"
 *                       maintenanceType:
 *                         type: string
 *                         example: "PROGRAMMATA"
 *             examples:
 *               success:
 *                 summary: Stato aggiornato
 *                 value:
 *                   message: "Stato cestino aggiornato con successo"
 *                   bin:
 *                     _id: "507f1f77bcf86cd799439014"
 *                     status: "MANUTENZIONE"
 *                     location:
 *                       type: "Point"
 *                       coordinates: [12.4964, 41.9028]
 *                     address: "Via Roma 45, 00100 Roma RM"
 *                     type: "INDIFFERENZIATO"
 *                     updatedAt: "2023-12-01T18:00:00Z"
 *                   statusHistory:
 *                     - status: "ATTIVO"
 *                       changedBy: "system"
 *                       changedAt: "2023-01-15T10:00:00Z"
 *                       reason: "Installazione iniziale"
 *                     - status: "MANUTENZIONE"
 *                       changedBy: "507f1f77bcf86cd799439013"
 *                       changedAt: "2023-12-01T18:00:00Z"
 *                       reason: "Manutenzione programmata settimanale"
 *                       maintenanceType: "PROGRAMMATA"
 *       400:
 *         description: Dati non validi o transizione di stato non permessa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Transizione non valida"
 *                 message:
 *                   type: string
 *                   example: "Non è possibile passare da INATTIVO a MANUTENZIONE"
 *                 allowedTransitions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["ATTIVO", "INATTIVO"]
 *       401:
 *         description: Token di autenticazione richiesto
 *       403:
 *         description: Privilegi insufficienti per modificare lo stato del cestino
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Accesso negato"
 *                 message:
 *                   type: string
 *                   example: "Solo operatori comunali e amministratori possono modificare lo stato dei cestini"
 *       404:
 *         description: Cestino non trovato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Cestino non trovato"
 *                 message:
 *                   type: string
 *                   example: "Nessun cestino trovato con l'ID specificato"
 */
router.route('/bins/:id/status')
    .patch(jwtAuth, binController.updateBinStatus);//PATCH /bins/:id/status - Aggiorna stato

//Statistics Routes
router.get('/stats/reports', reportController.getReportStats);//GET /stats/reports - Statistiche segnalazioni
router.get('/stats/bins', binController.getBinStats);//GET /stats/bins - Statistiche cestini

export default router;