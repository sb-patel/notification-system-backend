import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express";
import { JWT_USER_PASSWORD, JWT_ADMIN_PASSWORD } from "../../config";
import { blacklistedToken } from "../../database/models/blackListedToken";

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: "Access denied. No token provided !" });
        return;
    }

    const isBlackListed = await blacklistedToken.findOne({token});

    if(isBlackListed){
        res.status(401).json({
            message: "User is already logged out !"
        });
        return;
    }

    if(!JWT_USER_PASSWORD || !JWT_ADMIN_PASSWORD){
        res.status(401).json({ message: "Secret is not provided !" });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_USER_PASSWORD) as {id: string; role: string};

        req.user = decoded;
        next();
    }
    catch (error) {
        try {
            const decoded = jwt.verify(token, JWT_ADMIN_PASSWORD) as {id: string; role: string};

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
}