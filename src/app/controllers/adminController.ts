import fs from "fs";
import path from "path";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { Request, Response } from "express"
import { JWT_ADMIN_PASSWORD } from "../../config";
import { adminModel, AdminDocument } from "../../database/models/admin";
import { NotificationModel, NotificationDocument } from "../../database/models/notifications";
import { blacklistedToken } from "../../database/models/blackListedToken";
import { sendNotification } from "../../index";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: string;
            };
        }
    }
}

const signUpSchema = z.object({
    email: z.string().email(),              // Must be a valid email
    password: z.string().min(6),            // Minimum password length of 6 characters
    firstName: z.string().min(1, "First name is required"),           // First name must not be empty
    lastName: z.string().min(1)             // Last name must not be empty
});

const signInSchema = z.object({
    email: z.string().email(),              // Must be a valid email
    password: z.string().min(6)            // Minimum password length of 6 characters
});

const notificationSchema = z.object({
    message: z.string().min(1, "Message is required"),
    type: z.enum(["individual", "broadcast"], {
        errorMap: () => ({ message: "Invalid type" }),
    }),
    targetUserId: z.string().optional()
});


// Define the TypeScript type for the request body based on the Zod schema
type SignUpData = z.infer<typeof signUpSchema>;
type SignInData = z.infer<typeof signInSchema>;
type NotificationData = z.infer<typeof notificationSchema>;


export async function signUp(req: Request, res: Response): Promise<void> {
    try {
        // Validate the incoming data using Zod
        const userData: SignUpData = signUpSchema.parse(req.body);

        const { email, password, firstName, lastName } = userData;

        // Hash the password using bcrypt with a salt round of 10
        const hashedPassword: string = await bcrypt.hash(userData.password, 10);

        // await adminModel.create({
        //     email: email,
        //     password: hashedPassword,
        //     firstName: firstName,
        //     lastName: lastName
        // })

        const newAdmin: AdminDocument = new adminModel({
            email: email,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName
        });

        await newAdmin.save();

        res.status(201).json({
            message: "Admin created successfully !"
        })
    }
    catch (error: unknown) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                message: 'Validation error',
                errors: error.errors
            });
            return;
        }

        if (error instanceof Error && (error as any).code === 11000) {
            res.status(400).json({ message: 'Email already exists' });
            return;
        }

        res.status(500).json({
            "message": "Error creating a admin",
            "error": error instanceof Error ? error.message : "Unknown error",
        });
    }
}

export async function signIn(req: Request, res: Response): Promise<void> {
    try {
        const signData: SignInData = signInSchema.parse(req.body);

        const admin: AdminDocument | null = await adminModel.findOne({ email: signData.email });
        if (!admin) {
            res.status(400).json({
                message: "Admin with no such email exists !"
            })
            return;
        }

        const isMatch: boolean = await bcrypt.compare(signData.password.trim(), admin.password);
        if (!isMatch) {
            res.status(401).json({
                "message": "Invalid email or password"
            });
            return;
        }

        if (!JWT_ADMIN_PASSWORD) {
            res.status(401).json({
                "message": "Admin secret not provided"
            });
            return;
        }

        const token: string = jwt.sign(
            {
                id: admin._id,
                role: "admin"
            },
            JWT_ADMIN_PASSWORD,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token: token
        })
    }
    catch (error: unknown) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                message: 'Validation Error',
                errors: error.errors
            });
            return;
        }

        res.status(500).json({
            message: "Error during login",
            error: error instanceof Error ? error.message : "Unknown Error"
        })
    }
}

export async function logout(req: Request, res: Response): Promise<void> {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            res.status(400).json({ message: "Token not provided" });
            return;
        }

        const decoded: any = jwt.decode(token);
        if (!decoded || !decoded.exp) {
            res.status(400).json({ message: "Invalid token" });
            return;
        }

        const expiresAt = new Date(decoded.exp * 1000);

        await blacklistedToken.create({ token, expiresAt });

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error during logout", error });
    }
}


export async function broadcast(req: Request, res: Response): Promise<void> {
    try {
        const notificationData: NotificationData = notificationSchema.parse(req.body);
        const { message, type, targetUserId } = notificationData;

        if (type === "individual" && !targetUserId) {
            res.status(400).json({ error: "Target user ID is required for individual notifications." });
            return
        }

        const notification: NotificationDocument = new NotificationModel({
            message,
            type,
            targetUserId: type === "individual" ? targetUserId : null,
            createdAt: new Date(),
            read: false,
        });

        await notification.save();

        // Send WebSocket notification
        if (type === "individual" && targetUserId) {
            sendNotification(targetUserId, message);
        } else if (type === "broadcast") {
            sendNotification("", message, "broadcast");
        }

        res.status(201).json({ message: "Notification sent successfully.", notification });
    }
    catch (error: unknown) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                error: error.errors,
                message: "Validation Error"
            });
            return;
        }

        res.status(500).json({
            error: error instanceof Error ? error.message : "Unknown Error",
            message: "Error while sending a notification !"
        });
    }
}