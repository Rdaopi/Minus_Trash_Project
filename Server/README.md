# MinusTrash Backend

Minus Trash è una piattaforma digitale progettata per ottimizzare la gestione dei rifiuti urbani per i cittadini e per il Comune di Trento.
Nella repository ci sono due cartelle:

- Server
- Frontend



## Funzionalità principali

## Mappatura dei punti di raccolta
Visualizzazione in tempo reale dei contenitori dislocati sul territorio, con indicazioni sullo stato di riempimento, posizione GPS.

## Notifiche automatiche (in sviluppo)
Il sistema genera alert in caso di contenitori pieni, guasti o situazioni anomale, notificando automaticamente gli operatori.

## Statistiche e report (in sviluppo)
Dashboard con grafici e dati aggregati per monitorare l'andamento della raccolta per ottimizzare i percorsi di raccolta e migliorare l'efficienza del servizio.

## Area utente (fatto)
Accesso personalizzato per cittadini e operatori, con funzionalità dedicate:
- I cittadini possono segnalare problemi o consultare i dati ambientali locali.
- Gli operatori possono pianificare interventi e aggiornare lo stato dei contenitori.
- Gli amministratori possono gestire gli utenti, assegnare ruoli e fare tutto quello che fa un cittadino e un operatore.





# backend setup
0. npm install
1. Create a `.env` file in /config/
2. add for example
    PORT=5000
    MONGODB_URI_LOCAL="mongodb+srv://wudavide:<password>@cluster0.i1jlkrn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    GOOGLE_CLIENT_ID=...
    GOOGLE_CLIENT_SECRET=...
    JWT_ACCESS_SECRET=...
    JWT_REFRESH_SECRET=...
    MAIL_API_KEY=
    MAIL_API_SECRET
    NODE_ENV=production
    FRONTEND_URL=http://localhost:5173
    BACKEND_URL=http://localhost:5000   

3. check the URI variable used in db.js
    example process.env.MONGODB_URI_LOCAL;
4. cd Server
5. npm run dev

# frontend setup

0. npm install
1. create new terminal
2. cd FrontEnd
3. npm run dev
4. Create a `.env` file in /config/
5. add for example
    VITE_GOOGLE_CLIENT_ID=....
    VITE_API_URL=http://localhost:5000

# Google OAuth Configuration

## Local Development
1. Set up a project in Google Cloud Console
2. Configure OAuth credentials:
   - Authorized JavaScript origins: `http://localhost:5173` , `https://minus-trash-project-staticsite.onrender.com`,`api/auth/googleOAuth/callback`
   - Authorized redirect URIs: `http://localhost:5000/api/auth/googleOAuth/callback`, `https://minus-trash-project-webservice.onrender.com/api/auth/googleOAuth/callback`
3. Add credentials to your backend .env file:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### Production (Render)
1. Update OAuth credentials in Google Cloud Console:
   - Add Authorized JavaScript origins: `https://minus-trash-project-staticsite.onrender.com`
   - Add Authorized redirect URIs: `https://minus-trash-project-webservice.onrender.com/api/auth/googleOAuth/callback`

2. backend setting configuration (https://minus-trash-project-webservice.onrender.com)
   Repository=https://github.com/Rdaopi/Minus_Trash_Project
   Branch= your branch
   Root Directory=Server
   Build Command= npm install
   Start Command=npm start
3. Set environment variables in Render backend service:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   FRONTEND_URL=https://minus-trash-project-staticsite.onrender.com
   BACKEND_URL=https://minus-trash-project-webservice.onrender.com
   JWT_ACCESS_SECRET=...
   JWT_REFRESH_SECRET=...
   MAIL_API_KEY=...
   MAIL_API_SECRET=...
   MONGODB_URI_LOCAL=...
   NODE_ENV=production
   PORT=5000
   ```
4. frontend setting configuration
   Root Directory=FrontEnd
   Build Command=npm install && npm run build
   Publish Directory=dist
4. Set environment variables in Render frontend service:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   VITE_GOOGLE_CLIENT_ID=...
   ```
5. set rewrite role 
   Source= /.*    Destination=  /index.html  Action=Rewrite    or
   Source= /*    Destination=  /index.html  Action=Rewrite

# Static Site Routing with Render
 - Root Directory=FrontEnd
 - Build Command=npm install && npm run build
 - Publish Directory=dist
 - Source= /.*    Destination=  /index.html  Action=Rewrite    or
 - Source= /*    Destination=  /index.html  Action=Rewrite
   ```

### Backend Setup Commands
```bash
npm init -y                    # Initialize new Node.js project
npm install express           # Install Express.js framework
npm install mongoose         # MongoDB ODM
npm install cors            # Enable CORS
npm install dotenv          # Environment variables management
npm install bcryptjs        # Password hashing
npm install jsonwebtoken    # JWT authentication
npm install helmet          # Security middleware
npm install express-rate-limit  # Rate limiting
npm install swagger-jsdoc swagger-ui-express  # API documentation
npm install winston         # Logging
npm install mongoose-to-swagger  # Mongoose Parsing
```

### Backend Dev Dependencies
```bash
npm install --save-dev nodemon  # Auto-restart server during development
npm install --save-dev eslint   # Code linting
npm install --save-dev jest     # Testing
npm install --save-dev prettier # Code formatting
```

### Backend Commands
```bash
npm start                    # Start the server
npm run dev                  # Start server with nodemon (development)
npm test                     # Run tests  supertest e mock
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
```


 # install library for generating oas3.yaml
 
   - npm install js-yaml
   write code in /config/swagger.js
   

# supertest
   - npm install --save-dev supertest
   - npm install --save-dev jest


# npm run swagger:generate
   - generate both swagger-output.json and oas3.yaml
   

