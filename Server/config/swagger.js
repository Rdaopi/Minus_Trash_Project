import swaggerJsdoc from 'swagger-jsdoc'; //Importa la libreria per generare la documentazione Swagger/OpenAPI.

const options = {
  definition: {
    openapi: '3.0.0', //versione
    info: {
      title: 'Minus Trash API', //nome API
      version: '1.0.0',
      description: 'API for smart waste management system that allows users to report waste issues and manage waste bins'
    },
    servers: [
      { 
        url: 'http://localhost:3000/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
            name: { type: 'string' }
          }
        },
        WasteReport: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['litter', 'illegal_dumping', 'bin_issue', 'other'] },
            location: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' }
              }
            },
            description: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'verified', 'in_progress', 'resolved'] },
            urgency: { type: 'string', enum: ['low', 'medium', 'high'] }
          }
        },
        Bin: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['general', 'recycling', 'organic'] },
            location: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' }
              }
            },
            status: { type: 'string', enum: ['operational', 'needs_maintenance', 'out_of_service'] },
            capacity: { type: 'number' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Reports', description: 'Waste report management endpoints' },
      { name: 'Bins', description: 'Waste bin management endpoints' },
      { name: 'Statistics', description: 'Statistical data endpoints' }
    ]
  },
  apis: ['./modules/*/routes.js', './modules/*/controllers/*.js'] //Specifica i file contenenti le annotazioni Swagger (JSDoc). da modificare ***********************
};

export default swaggerJsdoc(options);   