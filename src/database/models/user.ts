import mongoose, { Document, Schema, Model } from "mongoose";

export interface UserDocument extends Document {
    email: string;
    password: string;
    username: string;
    role: string;
}

const userSchema: Schema<UserDocument> = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
});

export const userModel: Model<UserDocument> = mongoose.model<UserDocument>(
    "NotificationAUser",
    userSchema
)