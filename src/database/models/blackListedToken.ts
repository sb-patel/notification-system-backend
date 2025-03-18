import mongoose, { Schema, Model, Document } from "mongoose";

export interface BlacklistedTokenDocument extends Document {
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const BlacklistedTokenSchema: Schema<BlacklistedTokenDocument> = new Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true, // Adds `createdAt` and `updatedAt` fields automatically
});

export const blacklistedToken: Model<BlacklistedTokenDocument> = mongoose.model<BlacklistedTokenDocument>(
  "blacklistedToken",
  BlacklistedTokenSchema
);
