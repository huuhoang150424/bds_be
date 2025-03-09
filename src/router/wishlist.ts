import express, { Request, Response } from "express";
import { verifyRole} from "@middleware";
import {WishlistController} from '@controller';
const Router = express.Router();

Router.post('/addWishlist', verifyRole(["User"]),  WishlistController.addToWishlist as any);
Router.get('/:userId/getUserWishlist', WishlistController.getUserWishlist as any);
Router.delete('/:userId/removeFromWishlist', verifyRole(["User"]), WishlistController.removeFromWishlist as any);


export default Router;
