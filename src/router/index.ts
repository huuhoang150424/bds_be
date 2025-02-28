import { Express } from 'express';
import authRouter from "./auth";
import userRouter from "./user";
import postRouter from "./post";
import commentRouter from "./comment";
import ratingRouter from "./rating";
import pricingRouter from "./pricing";
import newRouter from "./new";
import reportRouter from "./reports";

const route=(app:Express)=>{
  app.use("/auth",authRouter)
  app.use("/user",userRouter)
	app.use("/post",postRouter)
	app.use("/comment",commentRouter)
	app.use("/rating",ratingRouter)
	app.use("/pricing",pricingRouter)
	app.use("/new",newRouter)
	app.use("/reports",reportRouter)

}

export default route;