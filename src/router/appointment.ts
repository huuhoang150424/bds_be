import express, { Request, Response } from "express";
const Router = express.Router();
import { verifyRole} from "@middleware";
import { AppointmentController } from "@controller";
// import { validatorAppointment } from "@validation";
import { Roles } from "@models/enums";


Router.post("/createAppointment",  verifyRole([Roles.User, Roles.Agent]), AppointmentController.createAppointment  as any);
Router.put("/:appointmentId/updateAppointment", verifyRole([Roles.User, Roles.Agent]), AppointmentController.updateAppointment as any);
Router.delete("/:appointmentId/deleteAppointment", verifyRole([Roles.User, Roles.Agent]), AppointmentController.deleteAppointment as any);
Router.get("/getUserAppointments", verifyRole([Roles.User, Roles.Agent]), AppointmentController.getUserAppointments as any);

export default Router;