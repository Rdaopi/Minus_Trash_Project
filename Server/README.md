
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

# useful commands 
# Backend Setup (in Server directory)
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

# Backend Dev Dependencies
npm install --save-dev nodemon  # Auto-restart server during development
npm install --save-dev eslint   # Code linting
npm install --save-dev jest     # Testing
npm install --save-dev prettier # Code formatting

# Frontend Setup (in FrontEnd directory)
npm create vite@latest         # Create Vue.js project with Vite
npm install vue               # Vue.js framework
npm install vue-router        # Vue routing
npm install bootstrap        # UI framework
npm install leaflet          # Maps integration

# Backend Commands (in Server directory)
npm start                    # Start the server
npm run dev                  # Start server with nodemon (development)
npm test                     # Run tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report

# Frontend Commands (in FrontEnd directory)
npm run dev                 # Start development server
npm run build              # Build for production
npm run preview            # Preview production build

# Create .env file in Server directory with:
touch .env                  # Create .env file
# Then add necessary environment variables like:
# PORT=3000
# MONGODB_URI=mongodb://localhost:27017/your_database
# JWT_SECRET=your_secret_key


# git commands
git init                    # Initialize repository
git add .                   # Add all files to staging
git commit -m "message"     # Commit changes
git branch development      # Create development branch
git checkout development    # Switch to development branch
git push origin development # Push to development branch

git pull origin development # Pull latest changes


# npm create vue@latest . 
                        # This command:
                        # 1. Creates the basic project structure
                        # 2. Generates vite.config.js
                        # 3. Sets up other configuration files

The command npm create vue@latest created these files and folders:
Root Files:
    package.json - Project configuration and dependencies
    package-lock.json - Exact dependency versions
    vite.config.js - Vite build tool configuration
    index.html - Entry HTML file
    .gitignore - Git ignore rules
    README.md - Project documentation
    jsconfig.json - JavaScript configuration
Directories:
    src/ - Source code directory
        App.vue - Root Vue component
        main.js - Application entry point
        assets/ - Static files like images
        components/ - Vue components
    public/ - Static files
    node_modules/ - Installed dependencies 



# npm install axios

Axios is a popular HTTP client library that makes it easier to send HTTP requests from your frontend to your backend or any other API. Here are the main functions and benefits of Axios:
Making HTTP Requests
GET: Fetch data
POST: Create data
PUT/PATCH: Update data
DELETE: Remove data
Key Features
Promise-based (works great with async/await)
Automatic JSON data transformation
Built-in error handling
Request and response interceptors
Request cancellation
Timeout handling
Progress monitoring for uploads/downloads



# Attention
    port of backend and frontend must be same eg. 5000
    check:
    index.js
    swagger.js
    googleAuth.js
    env.
    GoogleSignin.vue