import express, { Request, Response } from "express";
const Router = express.Router();
import { AuthController } from "../controller";
import {validatorRegister,validatorLogin} from "../validation";
import { verifyUser } from "../middleware";

Router.post("/login",validatorLogin, AuthController.login as any);
Router.post("/register",validatorRegister, AuthController.register as any);
Router.post("/logout", AuthController.logout as any);
Router.post("/refresh-token", AuthController.refreshToken as any);
Router.post("/forgot-password", AuthController.forgotPassword as any);
Router.post("/verify-code", AuthController.verifyCode as any);
Router.patch("/change-password",verifyUser, AuthController.changePassword as any);

export default Router;
