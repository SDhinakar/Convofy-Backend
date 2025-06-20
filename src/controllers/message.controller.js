import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, getIO } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select('-password');

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error in getUsersForSidebar:", error.message);
        res.status(500).json({ message: 'Internal Server error' });
    }
}

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 });
        res.status(200).json(messages);

    } catch (error) {
        console.error("Error in getMessages:", error.message);
        res.status(500).json({ message: 'Internal Server error' });
    }
}

export const sendMessages = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadedImage = await cloudinary.uploader.upload(image);
            imageUrl = uploadedImage.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        await newMessage.save();

        // Emit to receiver first (non-blocking)
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            getIO().to(receiverSocketId).emit("newMessage", newMessage);
        }

        // ✅ Only one response
        return res.status(201).json(newMessage);

    } catch (error) {
        console.error("Error in sendMessages Controller: ", error.message);
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Internal Server error' });
        }
    }
};