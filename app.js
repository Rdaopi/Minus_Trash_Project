const express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require("./model/user");
const userRoute = require("./routes/userRoute");
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;
const morgan = require("morgan");
const connectToDB = require("./controller/dbController");

//middleware
app.use(bodyParser.json());
app.use(morgan('dev')); // Logs requests in concise, colored format

//routes
app.use("/api", userRoute);

connectToDB(MONGO_URI); 


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
app.get("/", (req, res) => {
    res.send("Hello world!");
});




