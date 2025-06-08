import fs from 'fs';
import swaggerSpec from './swagger.js';

fs.writeFileSync('./swagger-output.json', JSON.stringify(swaggerSpec, null, 2));
console.log('✅ File swagger-output.json generato con successo.');

const yamlStr = yaml.dump(swaggerSpec);
fs.writeFileSync('./oas3.yaml', yamlStr, 'utf8');


//maybe this file is unused