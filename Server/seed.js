import mongoose from 'mongoose';
import 'dotenv/config';
import Bin from './modules/waste/models/Bin.js';
import Report from './modules/waste/models/Report.js';
import User from './modules/auth/models/User.js';

// 1. Connessione a MongoDB
await mongoose.connect(process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/minusTrashDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 2. Crea utenti di test
await User.deleteMany({});
const users = await User.insertMany([
  {
    username: 'mario.rossi',
    fullName: { name: 'Mario', surname: 'Rossi' },
    email: 'mario@example.com',
    role: 'cittadino',
    password: 'hashedpassword1'
  },
  {
    username: 'anna.bianchi',
    fullName: { name: 'Anna', surname: 'Bianchi' },
    email: 'anna@example.com',
    role: 'operatore_comunale',
    password: 'hashedpassword2'
  }
]);

// 3. Dati di esempio per i cestini
const bins = [
  {
    serialNumber: 'BIN001A',
    type: 'indifferenziato',
    capacity: 50,
    currentFillLevel: 20,
    location: {
      type: 'Point',
      coordinates: [12.4964, 41.9028],
      address: {
        street: 'Via Roma 1',
        city: 'Roma',
        postalCode: '00100',
        country: 'Italia'
      }
    },
    status: 'attivo',
    lastEmptied: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    maintenanceSchedule: {
      lastMaintenance: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      nextMaintenance: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60)
    },
    manufacturer: 'Ecoplast',
    installationDate: new Date('2022-01-15')
  },
  {
    serialNumber: 'BIN002B',
    type: 'plastica',
    capacity: 40,
    currentFillLevel: 80,
    location: {
      type: 'Point',
      coordinates: [12.4970, 41.9030],
      address: {
        street: 'Via Milano 10',
        city: 'Roma',
        postalCode: '00184',
        country: 'Italia'
      }
    },
    status: 'attivo',
    lastEmptied: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    maintenanceSchedule: {
      lastMaintenance: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
      nextMaintenance: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    },
    manufacturer: 'GreenBin',
    installationDate: new Date('2021-11-10')
  },
  {
    serialNumber: 'BIN003C',
    type: 'vetro',
    capacity: 60,
    currentFillLevel: 55,
    location: {
      type: 'Point',
      coordinates: [12.4980, 41.9040],
      address: {
        street: 'Piazza Navona',
        city: 'Roma',
        postalCode: '00186',
        country: 'Italia'
      }
    },
    status: 'manutenzione',
    lastEmptied: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    maintenanceSchedule: {
      lastMaintenance: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      nextMaintenance: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20)
    },
    manufacturer: 'EcoRoma',
    installationDate: new Date('2023-03-05')
  }
];

// 5. Popola il database
await Bin.deleteMany({});
await Report.deleteMany({});
const insertedBins = await Bin.insertMany(bins);

const reports = [
  {
    reportType: 'AREA_SPORCA',
    description: 'Rifiuti abbandonati vicino al cestino BIN001',
    location: { type: 'Point', coordinates: [12.4964, 41.9028] },
    status: 'IN_ATTESA',
    reportedBy: users[0]._id,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    comments: [
      { text: 'Situazione grave', author: 'moderatore', createdAt: new Date(Date.now() - 1000 * 60 * 60) }
    ]
  },
  {
    reportType: 'PROBLEMA_CESTINO',
    reportSubtype: 'ROTTO',
    relatedBin: insertedBins[1]._id, // BIN002B
    description: 'Il cestino BIN002 è danneggiato',
    location: { type: 'Point', coordinates: [12.4970, 41.9030] },
    status: 'IN_LAVORAZIONE',
    reportedBy: users[1]._id,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    comments: []
  },
  {
    reportType: 'RACCOLTA_SALTATA',
    description: 'La raccolta non è stata effettuata in via Garibaldi',
    location: { type: 'Point', coordinates: [12.4990, 41.9050] },
    status: 'RISOLTO',
    reportedBy: users[0]._id,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    comments: [
      { text: 'Intervento effettuato', author: 'operatore', createdAt: new Date() }
    ],
    missedCollectionDetails: {
      wasteType: 'PLASTICA',
      scheduledDate: new Date('2024-05-15'),
      area: 'Via Garibaldi'
    }
  },
  {
    reportType: 'AREA_SPORCA',
    description: 'Rifiuti sparsi in piazza Navona',
    location: { type: 'Point', coordinates: [12.4731, 41.8992] },
    status: 'IN_ATTESA',
    reportedBy: users[1]._id,
    createdAt: new Date(),
    comments: []
  }
];

await Report.insertMany(reports);

console.log('Database popolato con utenti, cestini e report di esempio!');
await mongoose.disconnect(); 