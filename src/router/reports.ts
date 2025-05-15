import express, { Request, Response } from "express";
const Router = express.Router();
import { verifyRole, paginationMiddleware} from "@middleware";
import { ReportsController } from "@controller";
import { validatorReport } from "@validation";
import { Roles } from "@models/enums";


Router.post("/createReports",validatorReport,  verifyRole([Roles.User,Roles.Agent]), ReportsController.createReport  as any);
Router.get("/:postId/getReportByPostId", verifyRole([Roles.User,Roles.Agent]), ReportsController.getReportsByPostId as any);
Router.get("/getAllReports", verifyRole([Roles.User]),paginationMiddleware, ReportsController.getAllReports as any);
Router.get("/getSummary", verifyRole([Roles.Admin]), ReportsController.getReportsSummary as any);
Router.patch("/:reportId/updateReport", verifyRole([Roles.Admin]), ReportsController.updateReport as any);

export default Router;