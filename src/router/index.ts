import { Express } from 'express';
import authRouter from "./auth";
import userRouter from "./user";

const route=(app:Express)=>{
  app.use("/auth",authRouter)
  app.use("/user",userRouter)
}

export default route;