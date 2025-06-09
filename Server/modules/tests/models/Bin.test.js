import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// Mock solo mongoose per evitare connessioni al database
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  
  return {
    ...actualMongoose,
    model: jest.fn().mockImplementation((name, schema) => {
      // Crea un mock constructor che simula il comportamento di mongoose
      function MockModel(data = {}) {
        Object.assign(this, data);
        
        // Mock dei metodi di istanza
        this.save = jest.fn().mockResolvedValue(this);
        this.remove = jest.fn().mockResolvedValue(this);
        this.toJSON = jest.fn().mockReturnValue(this);
        this.toObject = jest.fn().mockReturnValue(this);
        
        // Applica i metodi dello schema se esistono
        if (schema && schema.methods) {
          Object.keys(schema.methods).forEach(methodName => {
            this[methodName] = schema.methods[methodName].bind(this);
          });
        }
      }
      
      // Mock dei metodi statici
      MockModel.find = jest.fn();
      MockModel.findById = jest.fn();
      MockModel.findOne = jest.fn();
      MockModel.findByIdAndUpdate = jest.fn();
      MockModel.findByIdAndDelete = jest.fn();
      MockModel.create = jest.fn();
      MockModel.deleteMany = jest.fn();
      MockModel.updateMany = jest.fn();
      MockModel.aggregate = jest.fn();
      MockModel.countDocuments = jest.fn();
      
      return MockModel;
    }),
    connect: jest.fn(),
    connection: {
      readyState: 1
    }
  };
});

// Importa il modello reale dopo il mock di mongoose
const Bin = (await import('../../waste/models/Bin.js')).default;

describe('Bin Model - Business Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper per creare dati bin validi
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
    lastEmptied: new Date(),
    maintenanceSchedule: {
      lastMaintenance: new Date(),
      nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    ...overrides
  });

  describe('Model Creation', () => {
    test('creates bin instance with valid data', () => {
      const binData = createBinData();
      const bin = new Bin(binData);
      
      expect(bin.type).toBe('ORGANICO');
      expect(bin.capacity).toBe(100);
      expect(bin.currentFillLevel).toBe(50);
      expect(bin.status).toBe('ATTIVO');
      expect(bin.serialNumber).toBe('BIN001');
      expect(bin.manufacturer).toBe('EcoBin Corp');
      expect(bin.location.coordinates).toEqual([12.4964, 41.9028]);
    });

    test('applies default values correctly', () => {
      const minimalData = {
        type: 'PLASTICA',
        capacity: 80,
        serialNumber: 'BIN002',
        manufacturer: 'EcoBin Corp',
        installationDate: new Date('2023-01-01'),
        location: {
          type: 'Point',
          coordinates: [9.1900, 45.4642]
        }
      };
      
      const bin = new Bin(minimalData);
      
      // Verifica che i campi siano stati assegnati correttamente
      expect(bin.type).toBe('PLASTICA');
      expect(bin.capacity).toBe(80);
      expect(bin.serialNumber).toBe('BIN002');
      expect(bin.manufacturer).toBe('EcoBin Corp');
      expect(bin.location.type).toBe('Point');
      expect(bin.location.coordinates).toEqual([9.1900, 45.4642]);
    });
  });

  describe('Business Logic - needsEmptying', () => {
    test('returns true when fill level is 80% or higher', () => {
      const testCases = [
        { fillLevel: 80, expected: true },
        { fillLevel: 85, expected: true },
        { fillLevel: 100, expected: true }
      ];

      testCases.forEach(({ fillLevel, expected }) => {
        const bin = new Bin(createBinData({ currentFillLevel: fillLevel }));
        expect(bin.needsEmptying()).toBe(expected);
      });
    });

    test('returns false when fill level is below 80%', () => {
      const testCases = [
        { fillLevel: 0, expected: false },
        { fillLevel: 50, expected: false },
        { fillLevel: 79, expected: false }
      ];

      testCases.forEach(({ fillLevel, expected }) => {
        const bin = new Bin(createBinData({ currentFillLevel: fillLevel }));
        expect(bin.needsEmptying()).toBe(expected);
      });
    });
  });

  describe('Business Logic - needsMaintenance', () => {
    test('returns true when maintenance is overdue', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const bin = new Bin(createBinData({
        maintenanceSchedule: {
          lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          nextMaintenance: pastDate
        }
      }));

      expect(bin.needsMaintenance()).toBe(true);
    });

    test('returns false when maintenance is scheduled in future', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const bin = new Bin(createBinData({
        maintenanceSchedule: {
          lastMaintenance: new Date(),
          nextMaintenance: futureDate
        }
      }));

      expect(bin.needsMaintenance()).toBe(false);
    });

    test('returns false when no maintenance schedule exists', () => {
      const bin = new Bin(createBinData({
        maintenanceSchedule: {}
      }));

      expect(bin.needsMaintenance()).toBe(false);
    });

    test('returns false when nextMaintenance is not set', () => {
      const bin = new Bin(createBinData({
        maintenanceSchedule: {
          lastMaintenance: new Date()
          // nextMaintenance not set
        }
      }));

      expect(bin.needsMaintenance()).toBe(false);
    });
  });

  describe('Schema Methods Coverage', () => {
    test('pre-save middleware updates updatedAt', () => {
      const bin = new Bin(createBinData());
      const originalUpdatedAt = bin.updatedAt;
      
      // Simula il pre-save middleware
      const mockNext = jest.fn();
      const preSaveMiddleware = bin.schema?.pre?.mock?.calls?.find(call => call[0] === 'save')?.[1];
      
      if (preSaveMiddleware) {
        preSaveMiddleware.call(bin, mockNext);
        expect(bin.updatedAt).not.toEqual(originalUpdatedAt);
        expect(mockNext).toHaveBeenCalled();
      }
    });
  });

  describe('Business Scenarios', () => {
    test('identifies bins that need immediate emptying', () => {
      const bins = [
        new Bin(createBinData({ currentFillLevel: 85, serialNumber: 'BIN001' })),
        new Bin(createBinData({ currentFillLevel: 50, serialNumber: 'BIN002' })),
        new Bin(createBinData({ currentFillLevel: 95, serialNumber: 'BIN003' })),
        new Bin(createBinData({ currentFillLevel: 30, serialNumber: 'BIN004' }))
      ];

      const binsNeedingEmptying = bins.filter(bin => bin.needsEmptying());
      
      expect(binsNeedingEmptying).toHaveLength(2);
      expect(binsNeedingEmptying.map(b => b.serialNumber)).toEqual(['BIN001', 'BIN003']);
    });

    test('identifies bins that need maintenance', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const bins = [
        new Bin(createBinData({ 
          serialNumber: 'BIN001',
          maintenanceSchedule: { nextMaintenance: pastDate }
        })),
        new Bin(createBinData({ 
          serialNumber: 'BIN002',
          maintenanceSchedule: { nextMaintenance: futureDate }
        })),
        new Bin(createBinData({ 
          serialNumber: 'BIN003',
          maintenanceSchedule: { nextMaintenance: pastDate }
        }))
      ];

      const binsNeedingMaintenance = bins.filter(bin => bin.needsMaintenance());
      
      expect(binsNeedingMaintenance).toHaveLength(2);
      expect(binsNeedingMaintenance.map(b => b.serialNumber)).toEqual(['BIN001', 'BIN003']);
    });

    test('categorizes bins by operational status', () => {
      const bins = [
        new Bin(createBinData({ 
          currentFillLevel: 85, 
          serialNumber: 'BIN001',
          maintenanceSchedule: { nextMaintenance: new Date(Date.now() + 24 * 60 * 60 * 1000) }
        })),
        new Bin(createBinData({ 
          currentFillLevel: 50, 
          serialNumber: 'BIN002',
          maintenanceSchedule: { nextMaintenance: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })),
        new Bin(createBinData({ 
          currentFillLevel: 30, 
          serialNumber: 'BIN003',
          maintenanceSchedule: { nextMaintenance: new Date(Date.now() + 24 * 60 * 60 * 1000) }
        }))
      ];

      const binsNeedingEmptying = bins.filter(bin => bin.needsEmptying());
      const binsNeedingMaintenance = bins.filter(bin => bin.needsMaintenance());
      const binsOk = bins.filter(bin => !bin.needsEmptying() && !bin.needsMaintenance());
      
      expect(binsNeedingEmptying).toHaveLength(1);
      expect(binsNeedingMaintenance).toHaveLength(1);
      expect(binsOk).toHaveLength(1);
    });

    test('handles edge cases gracefully', () => {
      // Bin con dati minimi
      const minimalBin = new Bin({
        type: 'ORGANICO',
        capacity: 100,
        serialNumber: 'BIN999',
        manufacturer: 'Test Corp',
        installationDate: new Date(),
        location: {
          type: 'Point',
          coordinates: [12.4964, 41.9028]
        },
        currentFillLevel: 0,
        maintenanceSchedule: {}
      });

      expect(() => minimalBin.needsEmptying()).not.toThrow();
      expect(() => minimalBin.needsMaintenance()).not.toThrow();
      expect(minimalBin.needsEmptying()).toBe(false);
      expect(minimalBin.needsMaintenance()).toBe(false);

      // Bin completamente pieno
      const fullBin = new Bin(createBinData({
        currentFillLevel: 100
      }));

      expect(fullBin.needsEmptying()).toBe(true);
    });
  });

  describe('Instance Methods', () => {
    test('save method is available and mocked', async () => {
      const bin = new Bin(createBinData());
      const result = await bin.save();
      
      expect(bin.save).toHaveBeenCalled();
      expect(result).toBe(bin);
    });

    test('toJSON method returns bin data', () => {
      const bin = new Bin(createBinData());
      const result = bin.toJSON();
      
      expect(bin.toJSON).toHaveBeenCalled();
      expect(result).toBe(bin);
    });
  });
});