import { Router } from "express";
import { authMiddleware } from "../app/middleware/authMiddleware";
import * as userController from "../app/controllers/userController"
const userRouter = Router();


userRouter.post("/signup", userController.signUp);

userRouter.post("/signin", userController.signIn);

userRouter.get("/fetch", authMiddleware, userController.fetchNotification);

userRouter.put("/notification/update/:id", authMiddleware, userController.updateNotification);

export { userRouter };