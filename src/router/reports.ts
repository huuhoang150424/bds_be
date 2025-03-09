import express, { Request, Response } from "express";
const Router = express.Router();
import { verifyRole} from "@middleware";
import { ReportsController } from "@controller";
import { validatorReport } from "@validation";


Router.post("/createReports",validatorReport,  verifyRole(["User"]), ReportsController.createReport  as any);
Router.get("/:postId/getReportByPostId", verifyRole(["User"]), ReportsController.getReportsByPostId as any);
Router.get("/getAllReports", verifyRole(["User"]), ReportsController.getAllReports as any);



export default Router;