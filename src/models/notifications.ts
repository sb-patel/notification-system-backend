import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema({
    userId: { type: String, required: false },
    message: { type: String, required: true },
    type: { type: String, enum: ["individual", "broadcast"], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
});

export default mongoose.model("Notification", NotificationSchema);
