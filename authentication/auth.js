const jwt = require("jsonwebtoken");
require("dotenv").config();

function generateAccessToken(username) {   
    return jwt.sign({username}, process.env.TOKEN_SECRET, {expiresIn: "1h"});
}

function verifyToken(req, res, next) {
    const bearerToken = req.headers["authorization"];
    if (bearerToken) {
        const bearer = bearerToken.split(" ")[1];
        if(!bearerToken) {
            res.sendStatus(401);
        }
        jwt.verify(bearer, process.env.TOKEN_SECRET, (err,user)=>{
            if(err) {
                res.sendStatus(403);
            } 
            req.user = user;
            next();
        });
    }
}


module.exports = {generateAccessToken, verifyToken};
