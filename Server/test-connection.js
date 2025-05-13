import 'dotenv/config';

console.log('Test connessione MongoDB');
console.log('URI configurato:', process.env.MONGODB_URI ? 'Sì' : 'No');
if (process.env.MONGODB_URI) {
    // Mostra l'URI mascherando la password
    const maskedUri = process.env.MONGODB_URI.replace(
        /(mongodb\+srv:\/\/)([^:]+):([^@]+)@/,
        '$1$2:****@'
    );
    console.log('URI (password nascosta):', maskedUri);
}