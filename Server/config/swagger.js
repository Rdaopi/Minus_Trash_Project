// server/config/swagger.js
import swaggerJsdoc from 'swagger-jsdoc'; // Importa la libreria per generare la documentazione Swagger/OpenAPI.

const options = {
  definition: {
    openapi: '3.0.0', //versione
    info: {
      title: 'Minus Trash API', //nome API
      version: '1.0.0',
      description: 'API per la gestione rifiuti smart'
    },
    servers: [{ url: 'http://localhost:3000/api' }],     // manca il URL quello vero
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/modules/*/routes.js'] //Specifica i file contenenti le annotazioni Swagger (JSDoc). da modificare 
};

export default swaggerJsdoc(options);   