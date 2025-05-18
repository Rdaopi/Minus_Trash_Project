import swaggerJsdoc from 'swagger-jsdoc'; //Importa la libreria per generare la documentazione Swagger/OpenAPI.
import mongooseToSwagger from 'mongoose-to-swagger';
import User from '../modules/auth/models/User.js';


const options = {
  definition: {
    openapi: '3.0.0', //versione
    info: {
      title: 'Minus Trash API', //nome API
      version: '1.0.0',
      description: 'Documentazione API per Minus Trash'
    },
    servers: [{ url: 'http://localhost:3000' }],    
    components: {
      schemas: {
        User: mongooseToSwagger(User),//convert mongoose schema to swagger schema
      },
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    './Server/modules/auth/routes.js',
    './Server/modules/waste/routes.js'
  ] //Include both auth and waste route files
};

export default swaggerJsdoc(options);   