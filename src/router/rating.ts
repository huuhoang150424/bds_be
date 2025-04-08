import express, { Request, Response } from "express";
const Router = express.Router();
import {RatingController} from '@controller';
import {verifyRole} from "@middleware";
import {ratingValidation  } from "@validation";
import { Roles } from "@models/enums";

Router.post('/createRating',ratingValidation, verifyRole([Roles.User]),  RatingController.createRating as any);
Router.get('/:postId/getRatingsByPostId', RatingController.getRatingsByPostId as any);
Router.put('/:ratingId/updateRating',ratingValidation, verifyRole([Roles.User]), RatingController.updateRating as any);
Router.delete('/:ratingId/deleteRating', verifyRole([Roles.User]), RatingController.deleteRating as any);

export default Router;