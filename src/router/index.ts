import { Express } from 'express';
import authRouter from "./auth";
import userRouter from "./user";
import postRouter from "./post";
import commentRouter from "./comment";
import ratingRouter from "./rating";
import pricingRouter from "./pricing";
import newRouter from "./new";
import reportRouter from "./reports";
import transactionRouter from "./transaction";
import wishlistRouter from "./wishlist";

const route=(app:Express)=>{
  app.use("/auth",authRouter)
  app.use("/user",userRouter)
	app.use("/post",postRouter)
	app.use("/comment",commentRouter)
	app.use("/rating",ratingRouter)
	app.use("/pricing",pricingRouter)
	app.use("/new",newRouter)
	app.use("/reports",reportRouter)
	app.use("/new",pricingRouter)
	app.use("/transaction",transactionRouter)
	app.use("/wishlist",wishlistRouter)

}
export default route;