import express, { Request, Response } from "express";
const Router = express.Router();
import { AuthController } from "@controller";
import { verifyRole } from "@middleware/verify-token";
import { validatorRegister ,validatorLogin} from "@validation";


Router.post("/login",validatorLogin, AuthController.login as any);
Router.post("/register",validatorRegister, AuthController.register as any);
Router.post("/logout", verifyRole(["User"]),AuthController.logout as any);
Router.post("/refreshToken", AuthController.refreshToken as any);
Router.post("/forgotPassword", AuthController.forgotPassword as any);
Router.post("/verifyCode", AuthController.verifyCode as any);
Router.patch("/changePassword",verifyRole(["User"]), AuthController.changePassword as any);
Router.post("/verifyAccount", AuthController.verifyAccount as any);
Router.get("/verifyMail", AuthController.verifyEmail as any);

export default Router;
