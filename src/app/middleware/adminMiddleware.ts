
import { JWT_ADMIN_PASSWORD } from "../../config";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: "Access denied. No token provided !" });
        return
    }

    try {
        if(!JWT_ADMIN_PASSWORD){
            res.status(401).json({ message: "Admin secret is missing !" });
            return
        }
        const decoded = jwt.verify(token, JWT_ADMIN_PASSWORD) as { id: string; role: string };

        if (decoded.role !== 'admin') {
            res.status(403).json({ message: 'Access denied. Admins only.' });
            return
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        let message = "";
        if (error instanceof jwt.TokenExpiredError) {
            message = 'Token has expired';
        }
        else if (error instanceof jwt.JsonWebTokenError) {
            message = 'Invalid token or tampered token';
        }
        else {
            message = 'Token verification failed';
        }
        res.status(403).json({
            message,
            error
        })
    }
}