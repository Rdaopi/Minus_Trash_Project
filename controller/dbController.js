const mongoose = require("mongoose");

function connectToDB(MONGO_URI) {
    return new Promise((resolve, reject) => {
        mongoose.connect(MONGO_URI, {})
            .then(() => {
                console.log("Connected to MongoDB");
                resolve(); // important!
            })
            .catch((err) => {
                console.error("Failed to connect to MongoDB", err);
                reject(err); // important!
            });
    });
}

module.exports = connectToDB;
