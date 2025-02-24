import express, { Request, Response } from "express";
const Router = express.Router();
import { verifyAdmin ,verifyUser,verifyAgent} from "@middleware";


export default Router;