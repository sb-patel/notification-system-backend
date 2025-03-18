import { z } from "zod";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { JWT_USER_PASSWORD } from "../../config";
import { userModel, UserDocument } from "../../database/models/user";
import { NotificationModel } from "../../database/models/notifications";


const signUpSchema = z.object({
    email: z.string().email(),              // Must be a valid email
    password: z.string().min(6),            // Minimum password length of 6 characters
    firstName: z.string().min(1),           // First name must not be empty
    lastName: z.string().min(1)             // Last name must not be empty
});

const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

export async function signUp(req: Request, res: Response): Promise<void> {
    try {
        // Validate the incoming data using Zod
        const userData = signUpSchema.parse(req.body);

        const { email, password, firstName, lastName } = userData;

        // Hash the password using bcrypt with a salt round of 10
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        await userModel.create({
            email: userData.email,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName,
        });

        res.status(201).json({
            message: "User created successfully !"
        });
        return;
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
            "message": "Error creating a user",
            error: error instanceof Error ? error.message : "Unknown Error"
        });
        return;
    }
}

export async function signIn(req: Request, res: Response): Promise<void> {
    try {
        const signData = signInSchema.parse(req.body);

        const user: UserDocument | null = await userModel.findOne({ email: signData.email });
        if (!user) {
            res.status(400).json({
                message: "User with no such email exists !"
            })
            return;
        }

        const isMatch: boolean = await bcrypt.compare(signData.password.trim(), user.password);
        if (!isMatch) {
            res.status(400).json({
                "message": "Invalid email or password"
            });
            return;
        }

        if (!JWT_USER_PASSWORD) {
            res.status(400).json({
                "message": "No encryption key is provided"
            });
            return;
        }

        const token: string = jwt.sign({
            id: user._id,
            role: "user"
        }, JWT_USER_PASSWORD, { expiresIn: '1h' });

        res.json({
            message: 'Login successful',
            token: token
        })
        return;
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
        return;
    }
}

export async function fetchNotification(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user || !req.user.id) {
            res.status(404).json({
                message: "No user id provided"
            });
            return;
        }

        const userId = req.user.id;
        const { status } = req.query;

        let filter: any = { $or: [{ targetUserId: userId }, { type: "broadcast" }] };
        if (status === "unread") filter.read = false;
        if (status === "read") filter.read = true;

        const notifications = await NotificationModel.find(filter).sort({ createdAt: -1 });

        res.json({ notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export async function updateNotification(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user || !req.user.id) {
            res.status(404).json({
                message: "No user id provided"
            });
            return;
        }

        const userId = req.user.id;
        const notificationId = req.params.id;

        const notification = await NotificationModel.findOne({
            _id: notificationId,
            $or: [{ targetUserId: userId }, { type: "broadcast" }],
        });

        if (!notification) {
            res.status(404).json({ error: "Notification not found or access denied." });
            return;
        }

        notification.read = true;
        notification.updatedAt = new Date();
        await notification.save();

        res.json({ message: "Notification marked as read.", notification });
    } catch (error) {
        console.error("Error updating notification status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};