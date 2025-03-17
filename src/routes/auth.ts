import express from "express";
import User from "../models/user";
import bcrypt from "bcrypt";
import { z } from "zod";
import jwt from "jsonwebtoken";
import user from "../models/user";
import { Request, Response } from "express";
import dotenv from "dotenv";

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "user123";

dotenv.config();

const signUpSchema = z.object({
    email: z.string().email(),              // Must be a valid email
    password: z.string().min(6),            // Minimum password length of 6 characters
    username: z.string().min(1),           // First name must not be empty
    role: z.string().min(1),           // First name must not be empty
});

const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

// Login API for Users and Admins
router.post("/login", async (req: Request, res: Response): Promise<void> => {
    try {
        const signData = signInSchema.parse(req.body);

        const user = await User.findOne({ email: signData.email });
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

        if (!SECRET_KEY) {
            res.status(400).json({
                "message": "No encryption key is provided"
            });
            return;
        }

        const token: string = jwt.sign({
            id: user._id,
            role: user.role
        }, SECRET_KEY, { expiresIn: '1h' });

        res.json({
            message: 'Login successful',
            token: token,
            user: { id: user._id, username: user.username, role: user.role }
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
});

// Register User or Admin
router.post("/register", async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate the incoming data using Zod
        const userData = signUpSchema.parse(req.body);

        const { email, password, username, role } = userData;

        if (role && !["admin", "user"].includes(role)) {
            res.status(400).json({ error: "Invalid role." });
            return;
        }

        // Hash the password using bcrypt with a salt round of 10
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        await user.create({
            email: userData.email,
            password: hashedPassword,
            username,
            role
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
});

export default router;