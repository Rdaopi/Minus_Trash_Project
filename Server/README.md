# MinusTrash Backend

Minus Trash è una piattaforma digitale progettata per ottimizzare la gestione dei rifiuti urbani per i cittadini e per il Comune di Trento.
Nella repository ci sono due cartelle:

## Backend Setup

1. Install dependencies:
```bash
npm install
```

## Funzionalità principali

## Mappatura dei punti di raccolta
Visualizzazione in tempo reale dei contenitori dislocati sul territorio, con indicazioni sullo stato di riempimento, posizione GPS e ultimo svuotamento.

## Notifiche automatiche (in sviluppo)
Il sistema genera alert in caso di contenitori pieni, guasti o situazioni anomale, notificando automaticamente gli operatori.

## Statistiche e report (in sviluppo)
Dashboard con grafici e dati aggregati per monitorare l'andamento della raccolta per ottimizzare i percorsi di raccolta e migliorare l'efficienza del servizio.

## Area utente (in sviluppo)
Accesso personalizzato per cittadini e operatori, con funzionalità dedicate:
- I cittadini possono segnalare problemi o consultare i dati ambientali locali.
- Gli operatori possono pianificare interventi e aggiornare lo stato dei contenitori.



# backend setup
0. npm install
1. Create a `.env` file in /config/
2. add for example
    PORT=5000
    MONGODB_URI_LOCAL="mongodb+srv://wudavide:<password>@cluster0.i1jlkrn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    GOOGLE_CLIENT_ID=...
    GOOGLE_CLIENT_SECRET=...
    JWT_ACCESS_SECRET=...
    FRONTEND_URL=http://localhost:5173
    BACKEND_URL=http://localhost:5000   

3. check the URI variable used in db.js
    example process.env.MONGODB_URI_LOCAL;
4. cd Server
5. npm run dev

# frontend setup

0.npm install
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
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5000/api/auth/googleOAuth/callback`
3. Add credentials to your backend .env file:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   FRONTEND_URL=http://localhost:5173
   BACKEND_URL=http://localhost:5000
   ```
4. Add API URL to frontend .env:
   ```
   VITE_API_URL=http://localhost:5000
   ```

### Production (Render)
1. Update OAuth credentials in Google Cloud Console:
   - Add Authorized JavaScript origins: `https://your-frontend-url.onrender.com`
   - Add Authorized redirect URIs: `https://your-backend-url.onrender.com/api/auth/googleOAuth/callback`
2. Set environment variables in Render backend service:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   FRONTEND_URL=https://your-frontend-url.onrender.com
   BACKEND_URL=https://your-backend-url.onrender.com
   NODE_ENV=production
   ```
3. Set environment variables in Render frontend service:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

## Troubleshooting OAuth Problems
- If Google login works locally but not in production, check the environment variables
- If you get a 404 error after login, check the SPA routing configuration
- If you get a "redirect_uri_mismatch" error, verify the redirect URI in Google Cloud Console
- If you get "Token not received from the server", check the backend response format
- Use browser developer tools to inspect the network requests and identify the exact issue

# Static Site Routing with Render

Render static sites require special configuration for SPA routing:

1. Create a `/public/_redirects` file:
   ```
   /* /index.html 200
   ```

2. Create a `/public/render.yaml` file:
   ```yaml
   routes:
     - type: rewrite
       source: /*
       destination: /index.html
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
npm test                     # Run tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
```

## Important Notes
1. Make sure all environment variables are set correctly
2. For Google OAuth, the callback URL must match exactly in both the code and Google Cloud Console
3. Check these files for proper configuration:
   - index.js
   - swagger.js
   - googleAuth.js
   - .env file


# auto generate swagger-ooutput.json

npm install swagger-autogen --save-dev
remember to ignore this command at the start of server otherwise the server will restart constantly
 modify package.json ->> "dev": "nodemon --ignore swagger-output.json index.js",


 # Generate or Update oas3.yaml
 
   npm install js-yaml