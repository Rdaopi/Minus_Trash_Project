import fs from 'fs';
import swaggerSpec from './swagger.js';

fs.writeFileSync('./swagger.json', JSON.stringify(swaggerSpec, null, 2));
console.log('✅ Swagger spec written to swagger.json');