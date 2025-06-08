import swaggerJsdoc from 'swagger-jsdoc'; //Importa la libreria per generare la documentazione Swagger/OpenAPI.
import mongooseToSwagger from 'mongoose-to-swagger';
import User from '../modules/auth/models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises'; //Importa la libreria per gestire i file.
import yaml from 'js-yaml'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Funzione per pulire lo schema generato da mongoose-to-swagger
const cleanSchema = (schema) => {
  if (!schema || typeof schema !== 'object') return schema;
  
  const clean = { ...schema };
  
  // Rimuovi campi non supportati
  const unsupportedFields = ['format', 'tags', 'required', 'bearerFormat'];
  unsupportedFields.forEach(field => delete clean[field]);
  
  // Assicurati che le descrizioni siano stringhe
  if (clean.description) {
    if (Array.isArray(clean.description)) {
      clean.description = clean.description.join(', ');
    } else if (typeof clean.description !== 'string') {
      clean.description = String(clean.description);
    }
  }
  
  // Pulisci le proprietà ricorsivamente
  if (clean.properties) {
    Object.keys(clean.properties).forEach(key => {
      const prop = clean.properties[key];
      // Rimuovi format dalle proprietà
      if (prop.format) delete prop.format;
      // Assicurati che le descrizioni delle proprietà siano stringhe
      if (prop.description) {
        if (Array.isArray(prop.description)) {
          prop.description = prop.description.join(', ');
        } else if (typeof prop.description !== 'string') {
          prop.description = String(prop.description);
        }
      }
      clean.properties[key] = cleanSchema(prop);
    });
  }
  
  // Pulisci gli items se è un array
  if (clean.items) {
    const items = clean.items;
    // Rimuovi format dagli items
    if (items.format) delete items.format;
    // Assicurati che le descrizioni degli items siano stringhe
    if (items.description) {
      if (Array.isArray(items.description)) {
        items.description = items.description.join(', ');
      } else if (typeof items.description !== 'string') {
        items.description = String(items.description);
      }
    }
    clean.items = cleanSchema(items);
  }
  
  // Pulisci gli enum se presenti
  if (clean.enum && Array.isArray(clean.enum)) {
    clean.enum = clean.enum.map(item => String(item));
  }
  
  return clean;
};

// Funzione per pulire i path e le operazioni
const cleanPaths = (paths) => {
  const clean = {};
  
  Object.entries(paths).forEach(([path, operations]) => {
    clean[path] = {};
    
    Object.entries(operations).forEach(([method, operation]) => {
      const cleanOperation = { ...operation };
      
      // Rimuovi tags dalle operazioni
      delete cleanOperation.tags;
      
      // Pulisci il requestBody
      if (cleanOperation.requestBody) {
        delete cleanOperation.requestBody.required;
        if (cleanOperation.requestBody.content) {
          Object.keys(cleanOperation.requestBody.content).forEach(contentType => {
            const schema = cleanOperation.requestBody.content[contentType].schema;
            if (schema) {
              cleanOperation.requestBody.content[contentType].schema = cleanSchema(schema);
            }
          });
        }
      }
      
      // Assicurati che ci siano sempre le responses
      if (!cleanOperation.responses) {
        cleanOperation.responses = {
          '200': {
            description: 'Operazione completata con successo'
          }
        };
      }
      
      clean[path][method] = cleanOperation;
    });
  });
  
  return clean;
};

const options = {
  definition: {
    openapi: '3.0.0', //versione
    info: {
      title: 'Minus Trash API', //nome API
      version: '1.0.0',
      description: 'Documentazione API per Minus Trash'
    },
    servers: [
      { 
        url: `${process.env.BACKEND_URL}`,
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        User: cleanSchema(mongooseToSwagger(User))
      },
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer'
        },
        BasicAuth: {
          type: 'http',
          scheme: 'basic'
        }
      }
    }
  },
  apis: [
    path.resolve(__dirname, '../modules/auth/routes.js'),
    path.resolve(__dirname, '../modules/waste/routes.js')
  ] //Include both auth and waste route files
};

// Configurazione aggiuntiva per swagger-jsdoc
const swaggerOptions = {
  ...options,
  swaggerDefinition: options.definition,
  // Opzioni per assicurare la compatibilità OpenAPI 3.0
  swaggerOptions: {
    supportedSubmitMethods: ['get', 'post', 'put', 'delete'],
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    defaultModelsExpandDepth: -1
  }
};

// Genera la specifica e pulisci i path
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Rimuovi i tags a livello root
delete swaggerSpec.tags;

// Pulisci i path
swaggerSpec.paths = cleanPaths(swaggerSpec.paths);

// Pulisci tutti gli schemi nei components
if (swaggerSpec.components && swaggerSpec.components.schemas) {
  Object.keys(swaggerSpec.components.schemas).forEach(key => {
    swaggerSpec.components.schemas[key] = cleanSchema(swaggerSpec.components.schemas[key]);
  });
}

// Write the specification to swagger-output.json
const outputPath = path.resolve(__dirname, '../swagger-output.json');
await fs.writeFile(outputPath, JSON.stringify(swaggerSpec, null, 2), 'utf8')
  .then(() => console.log('Swagger documentation updated successfully'))
  .catch(err => console.error('Failed to update swagger documentation:', err));


//file yaml
const outputPath2 = path.resolve(__dirname, '../oas3.yaml'); 

try {
  const yamlContent = yaml.dump(swaggerSpec, { noRefs: true });
  await fs.writeFile(outputPath2, yamlContent, 'utf8');
  console.log('Swagger YAML documentation updated successfully');
} catch (err) {
  console.error('Failed to update Swagger YAML documentation:', err);
}

export default swaggerSpec;   

