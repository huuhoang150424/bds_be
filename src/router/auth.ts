import express, { Request, Response } from "express";
const Router = express.Router();
import { AuthController } from "@controller";
import { verifyRole } from "@middleware/verify-token";
import { validatorRegister ,validatorLogin} from "@validation";
import { Roles } from "@models/enums";


Router.post("/login",validatorLogin, AuthController.login as any);
Router.post("/loginGoogle", AuthController.googleLogin as any);
Router.post("/register",validatorRegister, AuthController.register as any);
Router.post("/logout", verifyRole([Roles.User,Roles.Agent]),AuthController.logout as any);
Router.post("/refreshToken", AuthController.refreshToken as any);
Router.post("/forgotPassword", AuthController.forgotPassword as any);
Router.post("/verifyCode", AuthController.verifyCode as any);
Router.patch("/changePassword",verifyRole([Roles.User]), AuthController.changePassword as any);
Router.patch("/resetPassword", AuthController.resetPassword as any);
Router.post("/verifyAccount", AuthController.verifyAccount as any);
Router.get("/verifyMail", AuthController.verifyEmail as any);

export default Router;
