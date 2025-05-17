const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../model/user");
const { getUsers, getUserById, createUser } = require("../controller/userController");
const {generateAccessToken} = require("../authentication/auth");

router.post("/register", async (req, res) => {
    const hash = await bcrypt.hash(req.body.password, process.env.SALT_ROUNDS);
    const {uuid, username, email} = req.body;
    const userData = new User({
        uuid,
        username,
        email,
        password: hash
    });
    try{
        await userData.save();
        const token = generateAccessToken(userData.uuid);
        res.status(200).json({message: "User created successfully", token});
    } catch (error) {
        res.status(400).json({message: "Error creating user"});
    }
});
router.post("/login", async (req, res) => {
    const {username, password} = req.body;
    const user = await User.findOne({username});
    if(user){
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(isPasswordValid){
            const token = generateAccessToken(user.username);
            res.status (200).json({
                message: "User logged in successfully", 
                token,
                ...User
            });
        }else{
            res.status(401).json({message: "Invalid password"});
        }
    }else{
        res.status(401).json({message: "Invalid username"});
    }
});


router.get("/users", getUsers); 
router.get("/users:id", getUserById);
router.post("/users", createUser);

module.exports = router;