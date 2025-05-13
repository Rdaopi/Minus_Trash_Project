import 'dotenv/config';

function checkMongoURI() {
    if (!process.env.MONGODB_URI) {
        console.error('ERRORE: URI MongoDB non trovato nel file .env');
        return;
    }

    const uri = process.env.MONGODB_URI;
    
    // Maschera la password per la sicurezza
    const maskedUri = uri.replace(
        /(mongodb\+srv:\/\/)([^:]+):([^@]+)@/,
        '$1$2:****@'
    );

    console.log('\nVerifica URI MongoDB:');
    console.log('URI (password nascosta):', maskedUri);
    
    // Verifica il formato base
    if (!uri.startsWith('mongodb+srv://')) {
        console.error('ERRORE: L\'URI deve iniziare con "mongodb+srv://"');
    }
    
    // Verifica la presenza di username e password
    if (!uri.includes('@')) {
        console.error('ERRORE: Mancano le credenziali nell\'URI');
    }
    
    // Verifica la presenza del nome del database
    const dbName = uri.split('/').pop().split('?')[0];
    if (!dbName) {
        console.error('ERRORE: Nome del database mancante nell\'URI');
    } else {
        console.log('Nome database:', dbName);
    }
    
    console.log('\nFormato corretto dovrebbe essere:');
    console.log('mongodb+srv://<username>:<password>@ac-dll6kwo.hhp2uxz.mongodb.net/<database>?retryWrites=true&w=majority');
}

checkMongoURI();