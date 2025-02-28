import { Express } from 'express';
import authRouter from "./auth";
import userRouter from "./user";
import postRouter from "./post";
import commentRouter from "./comment";
import ratingRouter from "./rating";
import pricingRouter from "./pricing";
<<<<<<< HEAD
import newRouter from "./new";
import reportRouter from "./reports";
=======
import transactionRouter from "./transaction";
>>>>>>> 33d2e24a10d23b39c1020d26f44c33fe1c75f35d

const route=(app:Express)=>{
  app.use("/auth",authRouter)
  app.use("/user",userRouter)
	app.use("/post",postRouter)
	app.use("/comment",commentRouter)
	app.use("/rating",ratingRouter)
	app.use("/pricing",pricingRouter)
<<<<<<< HEAD
	app.use("/new",newRouter)
	app.use("/reports",reportRouter)
=======
	app.use("/new",pricingRouter)
	app.use("/transaction",transactionRouter)
>>>>>>> 33d2e24a10d23b39c1020d26f44c33fe1c75f35d

}

export default route;