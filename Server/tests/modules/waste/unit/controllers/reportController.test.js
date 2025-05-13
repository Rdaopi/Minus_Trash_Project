import {
    createReport,
    getAllReports,
    getReportById,
    getReportsInArea,
    verifyReport
} from '../../../../../modules/waste/controllers/reportController.js';
import reportService from '../../../../../modules/waste/services/reportService.js';
import { logger } from '../../../../../core/utils/logger.js';

//Mock dei moduli
jest.mock('../../../../../modules/waste/services/reportService.js');
jest.mock('../../../../../core/utils/logger.js');

describe('Report Controller Tests', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    //Setup prima di ogni test
    beforeEach(() => {
        //Reset dei mock
        jest.clearAllMocks();
        
        //Mock degli oggetti request e response
        mockReq = {
            body: {},
            params: {},
            query: {},
            user: { _id: 'testUserId' }
        };
        
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        
        mockNext = jest.fn();
    });

    describe('createReport', () => {
        const sampleReport = {
            reportType: 'RIFIUTI_ABBANDONATI',
            reportSubtype: 'PLASTICA',
            location: {
                coordinates: [12.4924, 41.8902]
            },
            description: 'Test report'
        };

        it('should create a report successfully', async () => {
            //Prepara i dati di test
            const createdReport = { ...sampleReport, _id: 'testId' };
            mockReq.body = sampleReport;
            reportService.createReport.mockResolvedValue(createdReport);

            //Esegui il test
            await createReport(mockReq, mockRes);

            //Verifica i risultati
            expect(reportService.createReport).toHaveBeenCalledWith({
                ...sampleReport,
                reportedBy: 'testUserId'
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(createdReport);
            expect(logger.info).toHaveBeenCalled();
        });

        it('should handle errors during creation', async () => {
            //Simula un errore
            const error = new Error('Test error');
            mockReq.body = sampleReport;
            reportService.createReport.mockRejectedValue(error);

            //Esegui il test
            await createReport(mockReq, mockRes);

            //Verifica la gestione dell'errore
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: error.message });
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('getAllReports', () => {
        it('should return all reports', async () => {
            //Prepara i dati di test
            const reports = [
                { _id: '1', reportType: 'RIFIUTI_ABBANDONATI' },
                { _id: '2', reportType: 'AREA_SPORCA' }
            ];
            reportService.getReports.mockResolvedValue(reports);

            //Esegui il test
            await getAllReports(mockReq, mockRes);

            //Verifica i risultati
            expect(reportService.getReports).toHaveBeenCalledWith({});
            expect(mockRes.json).toHaveBeenCalledWith(reports);
        });

        it('should handle errors when fetching reports', async () => {
            //Simula un errore
            const error = new Error('Database error');
            reportService.getReports.mockRejectedValue(error);

            //Esegui il test
            await getAllReports(mockReq, mockRes);

            //Verifica la gestione dell'errore
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: error.message });
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('getReportById', () => {
        it('should return a specific report', async () => {
            //Prepara i dati di test
            const report = { _id: 'testId', reportType: 'RIFIUTI_ABBANDONATI' };
            mockReq.params.id = 'testId';
            reportService.getReportById.mockResolvedValue(report);

            //Esegui il test
            await getReportById(mockReq, mockRes);

            //Verifica i risultati
            expect(reportService.getReportById).toHaveBeenCalledWith('testId');
            expect(mockRes.json).toHaveBeenCalledWith(report);
        });

        it('should return 404 when report is not found', async () => {
            //Simula report non trovato
            mockReq.params.id = 'nonexistentId';
            reportService.getReportById.mockResolvedValue(null);

            //Esegui il test
            await getReportById(mockReq, mockRes);

            //Verifica la risposta
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Segnalazione non trovata' });
        });
    });

    describe('getReportsInArea', () => {
        it('should return reports in specified area', async () => {
            //Prepara i dati di test
            const areaReports = [
                { _id: '1', location: { coordinates: [12.4924, 41.8902] } }
            ];
            mockReq.query = {
                longitude: '12.4924',
                latitude: '41.8902',
                radius: '1000'
            };
            reportService.getNearbyReports.mockResolvedValue(areaReports);

            //Esegui il test
            await getReportsInArea(mockReq, mockRes);

            //Verifica i risultati
            expect(reportService.getNearbyReports).toHaveBeenCalledWith(
                [12.4924, 41.8902],
                1000
            );
            expect(mockRes.json).toHaveBeenCalledWith(areaReports);
        });
    });

    describe('verifyReport', () => {
        it('should verify a report successfully', async () => {
            //Prepara i dati di test
            const verifiedReport = {
                _id: 'testId',
                status: 'VERIFICATO'
            };
            mockReq.params.id = 'testId';
            mockReq.body = {
                notes: 'Verification notes',
                estimatedResolutionTime: new Date()
            };
            reportService.verifyReport.mockResolvedValue(verifiedReport);

            //Esegui il test
            await verifyReport(mockReq, mockRes);

            //Verifica i risultati
            expect(reportService.verifyReport).toHaveBeenCalledWith(
                'testId',
                'testUserId',
                'Verification notes',
                expect.any(Date)
            );
            expect(mockRes.json).toHaveBeenCalledWith(verifiedReport);
        });
    });
}); 