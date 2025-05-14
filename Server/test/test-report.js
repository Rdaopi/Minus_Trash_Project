import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Report from '../modules/waste/models/Report.js';

// Inizializza dotenv con il path corretto
dotenv.config({ path: '../config/.env' });

// Controllo dell'URI MongoDB
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI non trovata nelle variabili d\'ambiente');
  process.exit(1);
}

// Funzione di test
async function testReportFunctions() {
  console.log('\n------- TEST REPORT CONTROLLER -------\n');
  
  try {
    // Connessione a MongoDB
    console.log('Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connesso a MongoDB\n');
    
    // 1. CREA UN REPORT DI TEST
    console.log('1. Test creazione report:');
    const testReport = new Report({
      reportType: 'RIFIUTI_ABBANDONATI',
      reportSubtype: 'PLASTICA',
      severity: 'MEDIA',
      location: {
        type: 'Point', 
        coordinates: [11.1215, 46.0672], // Trento
        address: {
          street: 'Via Test',
          city: 'Trento',
          postalCode: '38100'
        }
      },
      description: 'Report di test creato per testing automatico',
      reportedBy: new mongoose.Types.ObjectId(), // ID fittizio
      images: [{
        url: 'https://example.com/test-image.jpg',
        description: 'Immagine di test'
      }]
    });
    
    // Salva il report
    const savedReport = await testReport.save();
    console.log(`✓ Report creato con ID: ${savedReport._id}`);
    console.log(`  Tipo: ${savedReport.reportType}`);
    console.log(`  Sottotipo: ${savedReport.reportSubtype}`);
    console.log(`  Stato: ${savedReport.status}`);
    console.log(`  Creato il: ${savedReport.createdAt}\n`);
    
    // 2. RECUPERA REPORT PER ID
    console.log('2. Test recupero report per ID:');
    const foundReport = await Report.findById(savedReport._id);
    if (foundReport) {
      console.log(`✓ Report trovato: ${foundReport._id}`);
    } else {
      console.log('✗ Report non trovato');
    }
    
    // 3. AGGIORNA REPORT
    console.log('\n3. Test aggiornamento report:');
    foundReport.severity = 'ALTA';
    foundReport.description += ' - AGGIORNATO';
    const updatedReport = await foundReport.save();
    console.log(`✓ Report aggiornato`);
    console.log(`  Nuova severità: ${updatedReport.severity}`);
    console.log(`  Descrizione aggiornata: ${updatedReport.description}`);
    
    // 4. VERIFICA REPORT
    console.log('\n4. Test verifica report:');
    const verifierUserId = new mongoose.Types.ObjectId();
    updatedReport.verify(verifierUserId, 'Verificato durante test', new Date(Date.now() + 86400000)); // +1 giorno
    await updatedReport.save();
    console.log(`✓ Report verificato`);
    console.log(`  Nuovo stato: ${updatedReport.status}`);
    console.log(`  Verificato il: ${updatedReport.verificationDetails.verifiedAt}`);
    
    // 5. RISOLVI REPORT
    console.log('\n5. Test risoluzione report:');
    const resolverUserId = new mongoose.Types.ObjectId();
    updatedReport.resolve(resolverUserId, 'Azione risolutiva di test');
    await updatedReport.save();
    console.log(`✓ Report risolto`);
    console.log(`  Stato finale: ${updatedReport.status}`);
    console.log(`  Risolto il: ${updatedReport.resolutionDetails.resolvedAt}`);
    
    // 6. ELIMINA REPORT DI TEST
    console.log('\n6. Pulizia - Eliminazione report di test:');
    await Report.findByIdAndDelete(updatedReport._id);
    console.log(`✓ Report eliminato`);
    
    // Verifica eliminazione
    const checkDeleted = await Report.findById(updatedReport._id);
    if (!checkDeleted) {
      console.log(`✓ Verificata eliminazione del report`);
    } else {
      console.log(`✗ Report non eliminato correttamente`);
    }
    
  } catch (error) {
    console.error(`\n❌ ERRORE: ${error.message}`);
    if (error.stack) console.error(error.stack);
  } finally {
    // Chiudi connessione
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('\nDisconnesso da MongoDB');
    }
    console.log('\n------- TEST COMPLETATO -------');
  }
}

testReportFunctions(); 