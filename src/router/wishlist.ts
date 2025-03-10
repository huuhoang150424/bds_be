import express, { Request, Response } from "express";
import { verifyRole} from "@middleware";
import {WishlistController} from '@controller';
const Router = express.Router();

Router.post('/addWishlist', verifyRole(["Agent","User"]),  WishlistController.addToWishlist as any);
Router.get('/getUserWishlist',verifyRole(["Agent","User"]) ,WishlistController.getUserWishlist as any);
Router.delete('/removeFromWishlist', verifyRole(["Agent","User"]), WishlistController.removeFromWishlist as any);


export default Router;
