import express, { Request, Response } from "express";
const Router = express.Router();
import { AuthController } from "@controller";
import { verifyRole } from "@middleware/verify-token";
import { validatorRegister ,validatorLogin} from "@validation";


Router.post("/login",validatorLogin, AuthController.login as any);
Router.post("/register",validatorRegister, AuthController.register as any);
Router.post("/logout", verifyRole(["User"]),AuthController.logout as any);
Router.post("/refresh-token", AuthController.refreshToken as any);
Router.post("/forgot-password", AuthController.forgotPassword as any);
Router.post("/verify-code", AuthController.verifyCode as any);
Router.patch("/change-password",verifyRole(["User"]), AuthController.changePassword as any);
Router.post("/verify-account", AuthController.verifyAccount as any);
Router.get("/verify-mail", AuthController.verifyEmail as any);

export default Router;
