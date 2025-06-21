import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from 'bcryptjs';
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        if (!fullName || !email || !password) return res.status(400).json({ message: "All fields are required" });
        if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters long" });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword
        }); // Create a new user instance 
        if (newUser) {
            generateToken(newUser._id, res); // Generate a JWT token for the new user
            await newUser.save(); // Save the new user to the database
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
                createdAt: newUser.createdAt, // ✅ include this
                message: "User created successfully"
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in signup controller ", error.message);
        res.status(400).json({ message: "User creation failed" });
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User does not exist" });

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

        generateToken(user._id, res); // Generate a JWT token for the user
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
            createdAt: user.createdAt, // ✅ include this
            message: "User logged in successfully"
        });

    } catch (error) {
        console.log("Error in login controller ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const { profilePic } = req.body;
        if (!profilePic) return res.status(400).json({ message: "Profile picture is required" });

        // Log base64 length to debug size issues
        console.log("Base64 Length:", profilePic.length);

        // Upload to Cloudinary from base64
        const uploadResponse = await cloudinary.uploader.upload(profilePic, {
            folder: "profile_pics",
        });
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true }
        );
        res.status(200).json({
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            profilePic: updatedUser.profilePic,
            createdAt: updatedUser.createdAt,
            message: "Profile updated successfully",
        });
    } catch (error) {
        console.log("Error in updateProfile controller ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}