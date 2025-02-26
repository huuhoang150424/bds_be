import { Express } from 'express';
import authRouter from "./auth";
import userRouter from "./user";
import postRouter from "./post";
import commentRouter from "./comment";
import ratingRouter from "./rating";
import pricingRouter from "./pricing";
import newRouter from "./new";

<<<<<<< HEAD
const route = (app: Express) => {
  app.use("/auth", authRouter)
  app.use("/user", userRouter)
  app.use("/post", postRouter)
  app.use("/comment", commentRouter)
  app.use("/rating", ratingRouter)
  app.use("/pricing", pricingRouter)
  app.use("/new", newRouter)

=======
const route=(app:Express)=>{
  app.use("/auth",authRouter)
  app.use("/user",userRouter)
	app.use("/post",postRouter)
	app.use("/comment",commentRouter)
	app.use("/rating",ratingRouter)
	app.use("/pricing",pricingRouter)
	app.use("/new",pricingRouter)
>>>>>>> 21d7c74616d1b165995ad7a16f275c803f652919
}

export default route;