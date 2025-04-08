import express, { Request, Response } from "express";
import { verifyRole} from "@middleware";
import {WishlistController} from '@controller';
import { Roles } from "@models/enums";
const Router = express.Router();

Router.post('/addWishlist', verifyRole([Roles.Agent,Roles.User]),  WishlistController.addToWishlist as any);
Router.get('/getUserWishlist',verifyRole([Roles.Agent,Roles.User]) ,WishlistController.getUserWishlist as any);
Router.delete('/removeFromWishlist', verifyRole([Roles.Agent,Roles.User]), WishlistController.removeFromWishlist as any);


export default Router;
