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

// Create a mock Bin model
const createMockBinModel = () => {
  function MockBin(data = {}) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
    this.toJSON = jest.fn().mockReturnValue(this);
  }

  // Static methods
  MockBin.find = jest.fn();
  MockBin.findById = jest.fn();
  MockBin.findByIdAndUpdate = jest.fn();
  MockBin.findByIdAndDelete = jest.fn();
  MockBin.create = jest.fn();

  return MockBin;
};

describe('Bins API', () => {
  let app;
  let mockBinModel;
  let mockBinService;
  let binController;

  beforeAll(async () => {
    // Create mock model
    mockBinModel = createMockBinModel();

    // Import the BinService class and create a mock instance
    const { BinService } = await import('../../waste/services/binService.js');
    mockBinService = new BinService(mockBinModel);

    // Import controllers
    binController = await import('../../waste/controllers/binController.js');
    
    // Inject the mock service into the controller
    binController.setBinService(mockBinService);

    // Create Express app
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = { 
        _id: '507f1f77bcf86cd799439011',
        role: 'operatore_comunale',
        username: 'testuser'
      };
      next();
    });

    // Setup routes with real controllers
    app.post('/api/waste/bins', binController.createBin);
    app.get('/api/waste/bins', binController.getAllBins);
    app.get('/api/waste/bins/area', binController.getBinsInArea);
    app.get('/api/waste/bins/type/:type', binController.getBinsByType);
    app.get('/api/waste/bins/maintenance', binController.getBinsNeedingMaintenance);
    app.get('/api/waste/bins/:id', binController.getBinById);
    app.put('/api/waste/bins/:id', binController.updateBin);
    app.put('/api/waste/bins/:id/status', binController.updateBinStatus);
    app.delete('/api/waste/bins/:id', binController.deleteBin);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all mock functions
    mockBinModel.find.mockReset();
    mockBinModel.findById.mockReset();
    mockBinModel.findByIdAndUpdate.mockReset();
    mockBinModel.findByIdAndDelete.mockReset();
    mockBinModel.create.mockReset();
    
    // Reset constructor to default behavior
    mockBinModel.constructor = function(data = {}) {
      Object.assign(this, data);
      this.save = jest.fn().mockResolvedValue(this);
      this.toJSON = jest.fn().mockReturnValue(this);
    };
  });

  // Helper to create bin data
  const createBinData = (overrides = {}) => ({
    type: 'ORGANICO',
    capacity: 100,
    currentFillLevel: 50,
    location: {
      type: 'Point',
      coordinates: [12.4964, 41.9028],
      address: {
        street: 'Via Roma',
        city: 'Roma',
        postalCode: '00100',
        country: 'Italia'
      }
    },
    status: 'ATTIVO',
    serialNumber: 'BIN001',
    manufacturer: 'EcoBin Corp',
    installationDate: new Date('2023-01-01'),
    ...overrides
  });

  describe('POST /api/waste/bins - Create Bin', () => {
    test('should create a new bin successfully', async () => {
      const binData = createBinData();
      const createdBin = { _id: '507f1f77bcf86cd799439011', ...binData };

      // Mock the service createBin method directly
      const originalCreateBin = mockBinService.createBin;
      mockBinService.createBin = jest.fn().mockResolvedValue(createdBin);

      const response = await request(app)
        .post('/api/waste/bins')
        .send(binData)
        .expect(201);

      // Check that the response has the expected structure
      expect(response.body).toHaveProperty('_id', createdBin._id);
      expect(response.body).toHaveProperty('type', binData.type);
      expect(response.body).toHaveProperty('capacity', binData.capacity);
      expect(response.body).toHaveProperty('serialNumber', binData.serialNumber);
      // Check that the service was called (dates get serialized as strings in JSON)
      expect(mockBinService.createBin).toHaveBeenCalledWith(expect.objectContaining({
        type: binData.type,
        capacity: binData.capacity,
        serialNumber: binData.serialNumber
      }));
      
      // Restore original method
      mockBinService.createBin = originalCreateBin;
    });

    test('should handle validation errors', async () => {
      const binData = createBinData();
      
      // Mock the BinService createBin method to throw an error
      const originalCreateBin = mockBinService.createBin;
      mockBinService.createBin = jest.fn().mockRejectedValue(new Error('Validation failed'));

      const response = await request(app)
        .post('/api/waste/bins')
        .send(binData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      
      // Restore original method
      mockBinService.createBin = originalCreateBin;
    });

    test('should handle all valid bin types', async () => {
      const binTypes = ['ORGANICO', 'PLASTICA', 'CARTA', 'VETRO', 'INDIFFERENZIATO'];

            for (const type of binTypes) {
        const binData = createBinData({ type, serialNumber: `BIN_${type}` });
        const createdBin = { _id: `507f1f77bcf86cd79943901${binTypes.indexOf(type)}`, ...binData };

        // Mock the service createBin method for each type
        const originalCreateBin = mockBinService.createBin;
        mockBinService.createBin = jest.fn().mockResolvedValue(createdBin);

        const response = await request(app)
          .post('/api/waste/bins')
          .send(binData)
          .expect(201);

        expect(response.body.type).toBe(type);
        
        // Restore original method
        mockBinService.createBin = originalCreateBin;
      }
    });
  });

  describe('GET /api/waste/bins - Get Bins', () => {
    test('should get all bins', async () => {
      const mockBins = [
        { _id: '507f1f77bcf86cd799439011', type: 'ORGANICO', serialNumber: 'BIN001' },
        { _id: '507f1f77bcf86cd799439012', type: 'PLASTICA', serialNumber: 'BIN002' }
      ];

      mockBinModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockBins)
      });

      const response = await request(app)
        .get('/api/waste/bins')
        .expect(200);

      expect(response.body).toEqual(mockBins);
      expect(mockBinModel.find).toHaveBeenCalledWith({});
    });

    test('should filter bins by query parameters', async () => {
      const filteredBins = [
        { _id: '507f1f77bcf86cd799439011', type: 'ORGANICO', status: 'ATTIVO' }
      ];

      mockBinModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(filteredBins)
      });

      const response = await request(app)
        .get('/api/waste/bins?type=ORGANICO&status=ATTIVO')
        .expect(200);

      expect(response.body).toEqual(filteredBins);
      expect(mockBinModel.find).toHaveBeenCalledWith({
        type: 'ORGANICO',
        status: 'ATTIVO'
      });
    });

    test('should handle database errors', async () => {
      mockBinModel.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await request(app)
        .get('/api/waste/bins')
        .expect(500);

      expect(response.body.error).toBe('Database error');
    });
  });

  describe('GET /api/waste/bins/:id - Get Bin by ID', () => {
    test('should get bin by id', async () => {
      const mockBin = { _id: '507f1f77bcf86cd799439011', type: 'ORGANICO', serialNumber: 'BIN001' };

      mockBinModel.findById.mockResolvedValue(mockBin);

      const response = await request(app)
        .get('/api/waste/bins/507f1f77bcf86cd799439011')
        .expect(200);

      expect(response.body).toEqual(mockBin);
      expect(mockBinModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    test('should return 404 for non-existent bin', async () => {
      mockBinModel.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/waste/bins/507f1f77bcf86cd799439999')
        .expect(404);

      expect(response.body.error).toBe('Cestino non trovato');
    });

    test('should handle database errors', async () => {
      mockBinModel.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/waste/bins/507f1f77bcf86cd799439011')
        .expect(500);

      expect(response.body.error).toBe('Database error');
    });
  });

  describe('PUT /api/waste/bins/:id - Update Bin', () => {
    test('should update bin successfully', async () => {
      const updateData = { currentFillLevel: 75 };
      const updatedBin = { _id: '507f1f77bcf86cd799439011', currentFillLevel: 75 };

      mockBinModel.findByIdAndUpdate.mockResolvedValue(updatedBin);

      const response = await request(app)
        .put('/api/waste/bins/507f1f77bcf86cd799439011')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedBin);
      expect(mockBinModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011', 
        updateData, 
        { new: true, runValidators: true }
      );
    });

    test('should return 404 for non-existent bin', async () => {
      mockBinModel.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/waste/bins/507f1f77bcf86cd799439999')
        .send({ currentFillLevel: 75 })
        .expect(404);

      expect(response.body.error).toBe('Cestino non trovato');
    });

    test('should handle database errors', async () => {
      mockBinModel.findByIdAndUpdate.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .put('/api/waste/bins/507f1f77bcf86cd799439011')
        .send({ currentFillLevel: 75 })
        .expect(500);

      expect(response.body.error).toBe('Update failed');
    });
  });

  describe('DELETE /api/waste/bins/:id - Delete Bin', () => {
    test('should delete bin successfully', async () => {
      mockBinModel.findByIdAndDelete.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/waste/bins/507f1f77bcf86cd799439011')
        .expect(200);

      expect(response.body.message).toBe('Cestino eliminato con successo');
      expect(mockBinModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    test('should handle database errors', async () => {
      mockBinModel.findByIdAndDelete.mockRejectedValue(new Error('Delete failed'));

      const response = await request(app)
        .delete('/api/waste/bins/507f1f77bcf86cd799439011')
        .expect(500);

      expect(response.body.error).toBe('Delete failed');
    });
  });

  describe('GET /api/waste/bins/area - Geospatial Queries', () => {
    test('should get bins in area', async () => {
      const nearbyBins = [
        { _id: '507f1f77bcf86cd799439011', location: { coordinates: [12.4964, 41.9028] } },
        { _id: '507f1f77bcf86cd799439012', location: { coordinates: [12.4970, 41.9030] } }
      ];

      mockBinModel.find.mockResolvedValue(nearbyBins);

      const response = await request(app)
        .get('/api/waste/bins/area?longitude=12.4964&latitude=41.9028&radius=1000')
        .expect(200);

      expect(response.body).toEqual(nearbyBins);
      expect(mockBinModel.find).toHaveBeenCalledWith({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [12.4964, 41.9028]
            },
            $maxDistance: 1000
          }
        }
      });
    });

    test('should use default radius when not provided', async () => {
      const nearbyBins = [];
      mockBinModel.find.mockResolvedValue(nearbyBins);

      await request(app)
        .get('/api/waste/bins/area?longitude=12.4964&latitude=41.9028')
        .expect(200);

      expect(mockBinModel.find).toHaveBeenCalledWith({
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
      mockBinModel.find.mockRejectedValue(new Error('Geospatial query failed'));

      const response = await request(app)
        .get('/api/waste/bins/area?longitude=12.4964&latitude=41.9028')
        .expect(500);

      expect(response.body.error).toBe('Geospatial query failed');
    });
  });

  describe('PUT /api/waste/bins/:id/status - Update Status', () => {
    test('should update bin status', async () => {
      const updatedBin = { _id: '507f1f77bcf86cd799439011', status: 'MANUTENZIONE' };

      mockBinModel.findByIdAndUpdate.mockResolvedValue(updatedBin);

      const response = await request(app)
        .put('/api/waste/bins/507f1f77bcf86cd799439011/status')
        .send({ status: 'MANUTENZIONE' })
        .expect(200);

      expect(response.body).toEqual(updatedBin);
      expect(mockBinModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { status: 'MANUTENZIONE', updatedAt: expect.any(Date) },
        { new: true }
      );
    });

    test('should handle database errors', async () => {
      mockBinModel.findByIdAndUpdate.mockRejectedValue(new Error('Status update failed'));

      const response = await request(app)
        .put('/api/waste/bins/507f1f77bcf86cd799439011/status')
        .send({ status: 'MANUTENZIONE' })
        .expect(500);

      expect(response.body.error).toBe('Status update failed');
    });
  });

  describe('GET /api/waste/bins/type/:type - Filter by Type', () => {
    test('should get bins by type', async () => {
      const organicBins = [
        { _id: '507f1f77bcf86cd799439011', type: 'ORGANICO', serialNumber: 'BIN001' },
        { _id: '507f1f77bcf86cd799439012', type: 'ORGANICO', serialNumber: 'BIN002' }
      ];

      mockBinModel.find.mockResolvedValue(organicBins);

      const response = await request(app)
        .get('/api/waste/bins/type/ORGANICO')
        .expect(200);

      expect(response.body).toEqual(organicBins);
      expect(mockBinModel.find).toHaveBeenCalledWith({ type: 'ORGANICO' });
    });

    test('should handle database errors', async () => {
      mockBinModel.find.mockRejectedValue(new Error('Type filter failed'));

      const response = await request(app)
        .get('/api/waste/bins/type/ORGANICO')
        .expect(500);

      expect(response.body.error).toBe('Type filter failed');
    });
  });

  describe('GET /api/waste/bins/maintenance - Maintenance Queries', () => {
    test('should get bins needing maintenance', async () => {
      const maintenanceBins = [
        { _id: '507f1f77bcf86cd799439011', status: 'MANUTENZIONE', serialNumber: 'BIN001' },
        { _id: '507f1f77bcf86cd799439012', status: 'ATTIVO', serialNumber: 'BIN002', needsMaintenance: true }
      ];

      mockBinModel.find.mockResolvedValue(maintenanceBins);

      const response = await request(app)
        .get('/api/waste/bins/maintenance')
        .expect(200);

      expect(response.body).toEqual(maintenanceBins);
      expect(mockBinModel.find).toHaveBeenCalledWith({
        $or: [
          { status: 'manutenzione' },
          { 'maintenanceSchedule.nextMaintenance': { $lte: expect.any(Date) } }
        ]
      });
    });

    test('should handle database errors', async () => {
      mockBinModel.find.mockRejectedValue(new Error('Maintenance query failed'));

      const response = await request(app)
        .get('/api/waste/bins/maintenance')
        .expect(500);

      expect(response.body.error).toBe('Maintenance query failed');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/waste/bins')
        .send('invalid-json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    test('should handle concurrent requests', async () => {
      const binData = createBinData();
      const createdBin = { _id: '507f1f77bcf86cd799439011', ...binData };

      // Mock the service createBin method directly
      const originalCreateBin = mockBinService.createBin;
      mockBinService.createBin = jest.fn().mockResolvedValue(createdBin);

      const requests = Array(3).fill().map(() =>
        request(app)
          .post('/api/waste/bins')
          .send(binData)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('_id', createdBin._id);
        expect(response.body).toHaveProperty('type', binData.type);
        expect(response.body).toHaveProperty('capacity', binData.capacity);
      });

      expect(mockBinService.createBin).toHaveBeenCalledTimes(3);
      
      // Restore original method
      mockBinService.createBin = originalCreateBin;
    });
  });
}); 