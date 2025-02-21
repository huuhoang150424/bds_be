import express, { Request, Response } from "express";
const Router = express.Router();
import { AuthController } from "@controller";

Router.post("/login", AuthController.login as any);
Router.post("/register", AuthController.register as any);


export default Router;
