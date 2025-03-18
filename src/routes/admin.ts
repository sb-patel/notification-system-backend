import { Router } from "express";
import { adminMiddleware } from "../app/middleware/adminMiddleware";
import * as adminController from "../app/controllers/adminController";
const adminRouter = Router();


// Admin Routes
adminRouter.post("/signup", adminController.signUp);

adminRouter.post("/signin", adminController.signIn);

adminRouter.post("/logout", adminController.logout);

adminRouter.post("/course", adminMiddleware, adminController.broadcast);

export { adminRouter };