import fs from 'fs';
import swaggerSpec from './swagger.js';

fs.writeFileSync('./swagger-output.json', JSON.stringify(swaggerSpec, null, 2));
console.log('✅ File swagger-output.json generato con successo.');
