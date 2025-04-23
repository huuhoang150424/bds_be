import { Express } from 'express';
import authRouter from "./auth";
import userRouter from "./user";
import postRouter from "./post";
import commentRouter from "./comment";
import ratingRouter from "./rating";
import pricingRouter from "./pricing";
import newRouter from "./news";
import reportRouter from "./reports";
import transactionRouter from "./transaction";
import wishlistRouter from "./wishlist";
import commentlikeRouter from "./comment-like";
import chatRouter from "./chat";
import statisticalRouter from "./statistical";
import notificationRouter from "./notification";
import ProfessionalAgentRouter from "./professional-agent";

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
	app.use("/commentlike", commentlikeRouter)
	app.use("/chat", chatRouter)
	app.use("/statistical", statisticalRouter)
	app.use("/notification", notificationRouter)
	app.use("/professionalAgent", ProfessionalAgentRouter)
}
export default route;