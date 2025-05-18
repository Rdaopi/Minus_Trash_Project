
# backend setup
1. Create a `.env` file in /config/
2. add for example
    PORT=3000
    MONGODB_URI_LOCAL= "mongodb+srv://wudavide:<password>@cluster0.i1jlkrn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"    
3. check the URI variable used in db.js
    example process.env.MONGODB_URI_LOCAL;
4. cd Server
5. npm run dev

# frontend setup
1. create new terminal
2. cd FrontEnd
3. npm run dev

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