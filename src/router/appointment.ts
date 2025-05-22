import express, { Request, Response } from "express";
const Router = express.Router();
import { paginationMiddleware, verifyRole} from "@middleware";
import { AppointmentController } from "@controller";
// import { validatorAppointment } from "@validation";
import { Roles } from "@models/enums";


Router.post("/createAppointment",  verifyRole([Roles.User, Roles.Agent]), AppointmentController.createAppointment  as any);//
Router.put("/:appointmentId/updateAppointment", verifyRole([Roles.User, Roles.Agent]), AppointmentController.updateAppointment as any);
Router.put("/:appointmentId/confirmAppointment", verifyRole([Roles.User, Roles.Agent]), AppointmentController.confirmAppointment as any);
Router.delete("/:appointmentId/deleteAppointment", verifyRole([Roles.User, Roles.Agent]), AppointmentController.deleteAppointment as any);
Router.get("/getUserAppointments", verifyRole([Roles.User, Roles.Agent]), AppointmentController.getUserAppointments as any);
Router.get("/getAppointmentsByUser", verifyRole([Roles.User, Roles.Agent]), paginationMiddleware,AppointmentController.getAllAppointmentsByUserId as any);
Router.get("/getSummary", verifyRole([Roles.User, Roles.Agent]),AppointmentController.getSummary as any);
Router.get("/getStatisticalByMonth", verifyRole([Roles.User, Roles.Agent]),AppointmentController.getStatisticalByMonth as any);
Router.get('/getAppointmentTypesStats', verifyRole([Roles.User, Roles.Agent]), AppointmentController.getAppointmentTypesStats as any);
Router.get('/getAppointmentTrend', verifyRole([Roles.User, Roles.Agent]), AppointmentController.getAppointmentTrend as any);
Router.get('/getPostTypeConversion', verifyRole([Roles.User, Roles.Agent]), AppointmentController.getPostTypeConversion as any);
export default Router;