import express, { Request, Response } from "express";
const Router = express.Router();
import { verifyRole} from "@middleware";
import { ReportsController } from "@controller";
import { validatorReport } from "@validation";
import { Roles } from "@models/enums";


Router.post("/createReports",validatorReport,  verifyRole([Roles.User]), ReportsController.createReport  as any);
Router.get("/:postId/getReportByPostId", verifyRole([Roles.User]), ReportsController.getReportsByPostId as any);
Router.get("/getAllReports", verifyRole([Roles.User]), ReportsController.getAllReports as any);



export default Router;