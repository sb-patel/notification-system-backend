import mongoose, { Document, Schema, Model } from "mongoose";

export interface NotificationDocument extends Document {
    userId: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema: Schema<NotificationDocument> = new Schema({
    userId: { type: String, required: false },
    message: { type: String, required: true },
    type: { type: String, enum: ["individual", "broadcast"], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
});

export const NotificationModel: Model<NotificationDocument> = mongoose.model<NotificationDocument>(
    "Notification",
    NotificationSchema
)