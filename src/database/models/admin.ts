// const mongoose = require("mongoose");
import mongoose, { Document, Model, Schema } from "mongoose";

// Define the interface for the Admin document
export interface AdminDocument extends Document {
    email: string;
    password: string;
    username: string;
    role: string;
}

const adminSchema: Schema<AdminDocument> = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
});

export const adminModel: Model<AdminDocument> = mongoose.model<AdminDocument>("NotificationAdmin", adminSchema);