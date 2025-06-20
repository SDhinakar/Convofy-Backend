import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
    try{
        const token = req.cookies.jwt; // Get the token from cookies
        if(!token) return res.status(401).json({message: "Unauthorized access, token not found"});
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
        if(!decoded) return res.status(401).json({message: "Unauthorized access, invalid token"});

        const user = await User.findById(decoded.userId).select("-password"); // Find the user by ID from the token
        if(!user) return res.status(404).json({message: "User not found"});

        req.user = user; // Attach the user to the request object
        next(); // Call the next middleware or route handler

    }catch(error){
        console.log("Error in protectRoute middleware ", error.message);
        res.status(500).json({message: "Internal server error"});
    }
}