
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