import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DISABLE_DB_FOR_TESTS = 'true';
process.env.MONGODB_URI = 'mongodb://mock-test-db';

// Mock logger first
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

jest.mock('../../../core/utils/logger.js', () => ({
  logger: mockLogger
}));

// Mock database connection
jest.mock('../../../config/db.js', () => ({
  default: jest.fn().mockResolvedValue(true)
}));

// Create a mock Report model
const createMockReportModel = () => {
  function MockReport(data = {}) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
    this.toJSON = jest.fn().mockReturnValue(this);
    this.verify = jest.fn();
    this.resolve = jest.fn();
  }

  // Helper to create chainable mock for populate
  const createPopulateChain = (finalValue) => {
    const chain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(finalValue)
    };
    // Make populate return the chain itself for chaining
    chain.populate.mockReturnValue(chain);
    return chain;
  };

  // Static methods
  MockReport.find = jest.fn();
  MockReport.findById = jest.fn();
  MockReport.findByIdAndUpdate = jest.fn();
  MockReport.findByIdAndDelete = jest.fn();
  MockReport.create = jest.fn();
  MockReport.countDocuments = jest.fn();
  MockReport.aggregate = jest.fn();

  return MockReport;
};

describe('Reports API', () => {
  let app;
  let mockReportModel;
  let mockReportService;
  let reportController;

  beforeAll(async () => {
    // Create mock model
    mockReportModel = createMockReportModel();

    // Import the ReportService class and create a mock instance
    const { ReportService } = await import('../../waste/services/reportService.js');
    mockReportService = new ReportService(mockReportModel);

    // Import controllers
    reportController = await import('../../waste/controllers/reportController.js');
    
    // Inject the mock service into the controller
    reportController.setReportService(mockReportService);

    // Create Express app
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = { 
        _id: '507f1f77bcf86cd799439011',
        role: 'cittadino',
        username: 'testuser'
      };
      next();
    });

    // Setup routes with real controllers
    app.post('/api/waste/reports', reportController.createReport);
    app.get('/api/waste/reports', reportController.getAllReports);
    app.get('/api/waste/reports/stats', reportController.getReportStats);
    app.get('/api/waste/reports/urgent', reportController.getUrgentReports);
    app.get('/api/waste/reports/area', reportController.getReportsInArea);
    app.get('/api/waste/reports/type/:type', reportController.getReportsByType);
    app.get('/api/waste/reports/status/:status', reportController.getReportsByStatus);
    app.get('/api/waste/reports/:id', reportController.getReportById);
    app.put('/api/waste/reports/:id', reportController.updateReport);
    app.delete('/api/waste/reports/:id', reportController.deleteReport);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all mock functions
    mockReportModel.find.mockReset();
    mockReportModel.findById.mockReset();
    mockReportModel.findByIdAndUpdate.mockReset();
    mockReportModel.findByIdAndDelete.mockReset();
    mockReportModel.create.mockReset();
    mockReportModel.countDocuments.mockReset();
    mockReportModel.aggregate.mockReset();
  });

  // Helper to create report data
  const createReportData = (overrides = {}) => ({
    reportType: 'RIFIUTI_ABBANDONATI',
    reportSubtype: 'PLASTICA',
    severity: 'MEDIA',
    location: {
      type: 'Point',
      coordinates: [12.4964, 41.9028],
      address: {
        street: 'Via Roma',
        number: '123',
        city: 'Roma',
        postalCode: '00100',
        additionalInfo: 'Vicino al parco'
      }
    },
    description: 'Segnalazione di rifiuti abbandonati in strada',
    ...overrides
  });

  describe('POST /api/waste/reports - Create Report', () => {
    test('should create a new report successfully', async () => {
      const reportData = createReportData();
      const createdReport = { 
        _id: '507f1f77bcf86cd799439011', 
        ...reportData, 
        reportedBy: '507f1f77bcf86cd799439011',
        status: 'IN_ATTESA'
      };

      // Mock the service createReport method directly
      const originalCreateReport = mockReportService.createReport;
      mockReportService.createReport = jest.fn().mockResolvedValue(createdReport);

      const response = await request(app)
        .post('/api/waste/reports')
        .send(reportData)
        .expect(201);

      expect(response.body).toEqual(createdReport);
      expect(mockReportService.createReport).toHaveBeenCalledWith({
        ...reportData,
        reportedBy: '507f1f77bcf86cd799439011'
      });
      
      // Restore original method
      mockReportService.createReport = originalCreateReport;
    });

    test('should handle validation errors', async () => {
      const reportData = createReportData();
      
      // Mock the service createReport method to throw an error
      const originalCreateReport = mockReportService.createReport;
      mockReportService.createReport = jest.fn().mockRejectedValue(new Error('Tipo segnalazione non valido'));

      const response = await request(app)
        .post('/api/waste/reports')
        .send(reportData)
        .expect(500);

      expect(response.body.error).toBe('Tipo segnalazione non valido');
      
      // Restore original method
      mockReportService.createReport = originalCreateReport;
    });

    test('should handle all valid report types', async () => {
      const reportTypes = [
        'RIFIUTI_ABBANDONATI',
        'AREA_SPORCA',
        'PROBLEMA_CESTINO',
        'RACCOLTA_SALTATA',
        'VANDALISMO',
        'SCARICO_ILLEGALE',
        'ALTRO'
      ];

      for (const reportType of reportTypes) {
        const reportData = createReportData({ reportType });
        const createdReport = { 
          _id: `507f1f77bcf86cd79943901${reportTypes.indexOf(reportType)}`, 
          ...reportData, 
          reportedBy: '507f1f77bcf86cd799439011'
        };

        // Mock the service createReport method for each type
        const originalCreateReport = mockReportService.createReport;
        mockReportService.createReport = jest.fn().mockResolvedValue(createdReport);

        const response = await request(app)
          .post('/api/waste/reports')
          .send(reportData)
          .expect(201);

        expect(response.body.reportType).toBe(reportType);
        
        // Restore original method
        mockReportService.createReport = originalCreateReport;
      }
    });

    test('should handle all severity levels', async () => {
      const severityLevels = ['BASSA', 'MEDIA', 'ALTA', 'URGENTE'];

      for (const severity of severityLevels) {
        const reportData = createReportData({ severity });
        const createdReport = { 
          _id: `507f1f77bcf86cd79943901${severityLevels.indexOf(severity)}`, 
          ...reportData, 
          reportedBy: '507f1f77bcf86cd799439011'
        };

        // Mock the service createReport method for each severity
        const originalCreateReport = mockReportService.createReport;
        mockReportService.createReport = jest.fn().mockResolvedValue(createdReport);

        const response = await request(app)
          .post('/api/waste/reports')
          .send(reportData)
          .expect(201);

        expect(response.body.severity).toBe(severity);
        
        // Restore original method
        mockReportService.createReport = originalCreateReport;
      }
    });
  });

  describe('GET /api/waste/reports - Get Reports', () => {
    test('should get all reports with default pagination', async () => {
      const mockReports = [
        { _id: '507f1f77bcf86cd799439011', reportType: 'RIFIUTI_ABBANDONATI', severity: 'MEDIA' },
        { _id: '507f1f77bcf86cd799439012', reportType: 'AREA_SPORCA', severity: 'ALTA' }
      ];

      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockReports)
      });

      const response = await request(app)
        .get('/api/waste/reports')
        .expect(200);

      expect(response.body).toEqual(mockReports);
      expect(mockReportModel.find).toHaveBeenCalledWith({});
    });

    test('should filter reports by valid query parameters', async () => {
      const filteredReports = [
        { _id: '507f1f77bcf86cd799439011', reportType: 'RIFIUTI_ABBANDONATI', status: 'IN_ATTESA' }
      ];

      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(filteredReports)
      });

      const response = await request(app)
        .get('/api/waste/reports?reportType=RIFIUTI_ABBANDONATI&status=IN_ATTESA')
        .expect(200);

      expect(response.body).toEqual(filteredReports);
      expect(mockReportModel.find).toHaveBeenCalledWith({
        reportType: 'RIFIUTI_ABBANDONATI',
        status: 'IN_ATTESA'
      });
    });

    test('should reject invalid filter parameters', async () => {
      const response = await request(app)
        .get('/api/waste/reports?invalidFilter=value')
        .expect(400);

      expect(response.body.error).toContain('Filtro non valido: invalidFilter');
    });

    test('should handle database errors', async () => {
      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await request(app)
        .get('/api/waste/reports')
        .expect(500);

      expect(response.body.error).toBe('Database error');
    });
  });

  describe('GET /api/waste/reports/:id - Get Report by ID', () => {
    test('should get report by id', async () => {
      const mockReport = { 
        _id: '507f1f77bcf86cd799439011', 
        reportType: 'RIFIUTI_ABBANDONATI', 
        severity: 'ALTA' 
      };

      const populateChain = {
        populate: jest.fn().mockReturnThis()
      };
      // Mock the final populate call to resolve with the report
      populateChain.populate.mockReturnValueOnce(populateChain).mockResolvedValueOnce(mockReport);
      mockReportModel.findById.mockReturnValue(populateChain);

      const response = await request(app)
        .get('/api/waste/reports/507f1f77bcf86cd799439011')
        .expect(200);

      expect(response.body).toEqual(mockReport);
      expect(mockReportModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    test('should return 404 for non-existent report', async () => {
      const populateChain = {
        populate: jest.fn().mockReturnThis()
      };
      // Mock the final populate call to resolve with null
      populateChain.populate.mockReturnValueOnce(populateChain).mockResolvedValueOnce(null);
      mockReportModel.findById.mockReturnValue(populateChain);

      const response = await request(app)
        .get('/api/waste/reports/507f1f77bcf86cd799439999')
        .expect(404);

      expect(response.body.error).toBe('Segnalazione non trovata');
    });

    test('should handle database errors', async () => {
      const populateChain = {
        populate: jest.fn().mockReturnThis()
      };
      // Mock the final populate call to reject with error
      populateChain.populate.mockReturnValueOnce(populateChain).mockRejectedValueOnce(new Error('Database error'));
      mockReportModel.findById.mockReturnValue(populateChain);

      const response = await request(app)
        .get('/api/waste/reports/507f1f77bcf86cd799439011')
        .expect(500);

      expect(response.body.error).toBe('Database error');
    });
  });

  describe('PUT /api/waste/reports/:id - Update Report', () => {
    test('should update report successfully', async () => {
      const updateData = { severity: 'ALTA' };
      const updatedReport = { _id: '507f1f77bcf86cd799439011', severity: 'ALTA' };

      mockReportModel.findByIdAndUpdate.mockResolvedValue(updatedReport);

      const response = await request(app)
        .put('/api/waste/reports/507f1f77bcf86cd799439011')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedReport);
      expect(mockReportModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011', 
        updateData, 
        { new: true, runValidators: true }
      );
    });

    test('should return 404 for non-existent report', async () => {
      mockReportModel.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/waste/reports/507f1f77bcf86cd799439999')
        .send({ severity: 'ALTA' })
        .expect(404);

      expect(response.body.error).toBe('Segnalazione non trovata');
    });

    test('should handle database errors', async () => {
      mockReportModel.findByIdAndUpdate.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .put('/api/waste/reports/507f1f77bcf86cd799439011')
        .send({ severity: 'ALTA' })
        .expect(500);

      expect(response.body.error).toBe('Update failed');
    });
  });

  describe('DELETE /api/waste/reports/:id - Delete Report', () => {
    test('should delete report successfully as owner', async () => {
      const mockReport = { 
        _id: '507f1f77bcf86cd799439011', 
        reportedBy: '507f1f77bcf86cd799439011',
        status: 'IN_ATTESA'
      };

      const populateChain = {
        populate: jest.fn().mockReturnThis()
      };
      // Mock the final populate call to resolve with the report
      populateChain.populate.mockReturnValueOnce(populateChain).mockResolvedValueOnce(mockReport);
      mockReportModel.findById.mockReturnValue(populateChain);
      mockReportModel.findByIdAndDelete.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/waste/reports/507f1f77bcf86cd799439011')
        .expect(200);

      expect(response.body.message).toBe('Segnalazione eliminata con successo');
      expect(mockReportModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    test('should return 404 for non-existent report', async () => {
      const populateChain = {
        populate: jest.fn().mockReturnThis()
      };
      // Mock the final populate call to resolve with null
      populateChain.populate.mockReturnValueOnce(populateChain).mockResolvedValueOnce(null);
      mockReportModel.findById.mockReturnValue(populateChain);

      const response = await request(app)
        .delete('/api/waste/reports/507f1f77bcf86cd799439999')
        .expect(404);

      expect(response.body.error).toBe('Segnalazione non trovata');
    });

    test('should return 403 for unauthorized deletion', async () => {
      const mockReport = { 
        _id: '507f1f77bcf86cd799439011', 
        reportedBy: '507f1f77bcf86cd799439999', // Different user
        status: 'IN_ATTESA'
      };

      const populateChain = {
        populate: jest.fn().mockReturnThis()
      };
      // Mock the final populate call to resolve with the report
      populateChain.populate.mockReturnValueOnce(populateChain).mockResolvedValueOnce(mockReport);
      mockReportModel.findById.mockReturnValue(populateChain);

      const response = await request(app)
        .delete('/api/waste/reports/507f1f77bcf86cd799439011')
        .expect(403);

      expect(response.body.error).toBe('Non autorizzato');
    });
  });

  describe('GET /api/waste/reports/area - Geospatial Queries', () => {
    test('should get reports in area', async () => {
      const nearbyReports = [
        { _id: '507f1f77bcf86cd799439011', location: { coordinates: [12.4964, 41.9028] } },
        { _id: '507f1f77bcf86cd799439012', location: { coordinates: [12.4970, 41.9030] } }
      ];

      mockReportModel.find.mockResolvedValue(nearbyReports);

      const response = await request(app)
        .get('/api/waste/reports/area?longitude=12.4964&latitude=41.9028&radius=500')
        .expect(200);

      expect(response.body).toEqual(nearbyReports);
      expect(mockReportModel.find).toHaveBeenCalledWith({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [12.4964, 41.9028]
            },
            $maxDistance: 500
          }
        }
      });
    });

    test('should use default radius when not provided', async () => {
      const nearbyReports = [];
      mockReportModel.find.mockResolvedValue(nearbyReports);

      await request(app)
        .get('/api/waste/reports/area?longitude=12.4964&latitude=41.9028')
        .expect(200);

      expect(mockReportModel.find).toHaveBeenCalledWith({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [12.4964, 41.9028]
            },
            $maxDistance: 1000 // default radius
          }
        }
      });
    });

    test('should handle database errors', async () => {
      mockReportModel.find.mockRejectedValue(new Error('Geospatial query failed'));

      const response = await request(app)
        .get('/api/waste/reports/area?longitude=12.4964&latitude=41.9028')
        .expect(500);

      expect(response.body.error).toBe('Geospatial query failed');
    });
  });

  describe('GET /api/waste/reports/type/:type - Filter by Type', () => {
    test('should get reports by type', async () => {
      const wasteReports = [
        { _id: '507f1f77bcf86cd799439011', reportType: 'RIFIUTI_ABBANDONATI', severity: 'MEDIA' },
        { _id: '507f1f77bcf86cd799439012', reportType: 'RIFIUTI_ABBANDONATI', severity: 'ALTA' }
      ];

      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(wasteReports)
      });

      const response = await request(app)
        .get('/api/waste/reports/type/RIFIUTI_ABBANDONATI')
        .expect(200);

      expect(response.body).toEqual(wasteReports);
      expect(mockReportModel.find).toHaveBeenCalledWith({ reportType: 'RIFIUTI_ABBANDONATI' });
    });

    test('should handle database errors', async () => {
      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error('Type filter failed'))
      });

      const response = await request(app)
        .get('/api/waste/reports/type/RIFIUTI_ABBANDONATI')
        .expect(500);

      expect(response.body.error).toBe('Type filter failed');
    });
  });

  describe('GET /api/waste/reports/status/:status - Filter by Status', () => {
    test('should get reports by status', async () => {
      const pendingReports = [
        { _id: '507f1f77bcf86cd799439011', status: 'IN_ATTESA', severity: 'MEDIA' },
        { _id: '507f1f77bcf86cd799439012', status: 'IN_ATTESA', severity: 'ALTA' }
      ];

      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(pendingReports)
      });

      const response = await request(app)
        .get('/api/waste/reports/status/IN_ATTESA')
        .expect(200);

      expect(response.body).toEqual(pendingReports);
      expect(mockReportModel.find).toHaveBeenCalledWith({ status: 'IN_ATTESA' });
    });

    test('should handle database errors', async () => {
      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error('Status filter failed'))
      });

      const response = await request(app)
        .get('/api/waste/reports/status/IN_ATTESA')
        .expect(500);

      expect(response.body.error).toBe('Status filter failed');
    });
  });

  describe('GET /api/waste/reports/urgent - Urgent Reports', () => {
    test('should get urgent reports', async () => {
      const urgentReports = [
        { _id: '507f1f77bcf86cd799439011', severity: 'URGENTE', reportType: 'SCARICO_ILLEGALE' },
        { _id: '507f1f77bcf86cd799439012', severity: 'URGENTE', reportType: 'VANDALISMO' }
      ];

      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(urgentReports)
      });

      const response = await request(app)
        .get('/api/waste/reports/urgent')
        .expect(200);

      expect(response.body).toEqual(urgentReports);
      expect(mockReportModel.find).toHaveBeenCalledWith({ severity: 'URGENTE' });
    });

    test('should handle database errors', async () => {
      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error('Urgent query failed'))
      });

      const response = await request(app)
        .get('/api/waste/reports/urgent')
        .expect(500);

      expect(response.body.error).toBe('Urgent query failed');
    });
  });

  describe('GET /api/waste/reports/stats - Report Statistics', () => {
    test('should get report statistics', async () => {
      const mockStats = {
        total: 150,
        byType: { 
          RIFIUTI_ABBANDONATI: 50, 
          AREA_SPORCA: 30, 
          PROBLEMA_CESTINO: 25 
        },
        byStatus: { 
          IN_ATTESA: 40, 
          VERIFICATO: 30, 
          RISOLTO: 80 
        },
        bySeverity: { 
          BASSA: 60, 
          MEDIA: 50, 
          ALTA: 30, 
          URGENTE: 10 
        }
      };

      // Mock the aggregate calls
      mockReportModel.countDocuments.mockResolvedValue(150);
      mockReportModel.aggregate
        .mockResolvedValueOnce([
          { _id: 'RIFIUTI_ABBANDONATI', count: 50 },
          { _id: 'AREA_SPORCA', count: 30 },
          { _id: 'PROBLEMA_CESTINO', count: 25 }
        ])
        .mockResolvedValueOnce([
          { _id: 'IN_ATTESA', count: 40 },
          { _id: 'VERIFICATO', count: 30 },
          { _id: 'RISOLTO', count: 80 }
        ])
        .mockResolvedValueOnce([
          { _id: 'BASSA', count: 60 },
          { _id: 'MEDIA', count: 50 },
          { _id: 'ALTA', count: 30 },
          { _id: 'URGENTE', count: 10 }
        ]);

      const response = await request(app)
        .get('/api/waste/reports/stats')
        .expect(200);

      expect(response.body).toEqual(mockStats);
      expect(mockReportModel.countDocuments).toHaveBeenCalled();
      expect(mockReportModel.aggregate).toHaveBeenCalledTimes(3);
    });

    test('should handle database errors', async () => {
      mockReportModel.countDocuments.mockRejectedValue(new Error('Stats calculation failed'));

      const response = await request(app)
        .get('/api/waste/reports/stats')
        .expect(500);

      expect(response.body.error).toBe('Stats calculation failed');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/waste/reports')
        .send('invalid-json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    test('should handle concurrent requests', async () => {
      const reportData = createReportData();
      const createdReport = { 
        _id: '507f1f77bcf86cd799439011', 
        ...reportData, 
        reportedBy: '507f1f77bcf86cd799439011'
      };

      // Mock the service createReport method
      const originalCreateReport = mockReportService.createReport;
      mockReportService.createReport = jest.fn().mockResolvedValue(createdReport);

      const requests = Array(3).fill().map(() =>
        request(app)
          .post('/api/waste/reports')
          .send(reportData)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('_id', createdReport._id);
        expect(response.body).toHaveProperty('reportType', reportData.reportType);
      });

      expect(mockReportService.createReport).toHaveBeenCalledTimes(3);
      
      // Restore original method
      mockReportService.createReport = originalCreateReport;
    });
  });
}); 