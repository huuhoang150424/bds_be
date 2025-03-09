import express, { Request, Response } from "express";
const Router = express.Router();
import {RatingController} from '@controller';
import {verifyRole} from "@middleware";

Router.post('/createRating', verifyRole(["User"]),  RatingController.createRating as any);
Router.get('/:postId/getRatingsByPostId', RatingController.getRatingsByPostId as any);
Router.put('/:ratingId/updateRating', verifyRole(["User"]), RatingController.updateRating as any);
Router.delete('/:ratingId/deleteRating', verifyRole(["User"]), RatingController.deleteRating as any);

export default Router;