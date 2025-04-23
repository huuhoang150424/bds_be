import express, { Request, Response } from "express";
const Router = express.Router();
import { verifyRole} from "@middleware";
import {ProfessionalAgentController } from '@controller';
import { Roles } from "@models/enums";

Router.post('/checkProfessionalStatus',verifyRole([Roles.Admin, Roles.Agent]), ProfessionalAgentController.checkProfessionalStatus as any);
Router.get('/getProfessionalAgents',verifyRole([Roles.Admin, Roles.Agent]), ProfessionalAgentController.getProfessionalAgents as any);
Router.get('/checkUserStatus',verifyRole([Roles.Admin, Roles.Agent]), ProfessionalAgentController.checkUserStatus as any);
Router.get('/checkUserCriteria',verifyRole([Roles.Admin, Roles.Agent]), ProfessionalAgentController.checkUserCriteria as any);
export default Router;