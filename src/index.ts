import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import authRoutes from "./routes/auth";


dotenv.config();

const app = express();
const server = http.createServer(app);



// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);


async function main() {
    try {
        if (!process.env.MONGO_URL) {
            return;
        }

        await mongoose.connect(process.env.MONGO_URL);
        console.log(process.env.MONGO_URL);

        // Start Server
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.log(error instanceof Error ? error.message : "Unknown Error");
    }
};

main();


