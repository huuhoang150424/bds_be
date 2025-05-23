import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import body_parser from 'body-parser';
import morgan from 'morgan';
import { connectDatabase } from '@models/connect';
import { errorMiddleware,apiLimiter } from '@middleware';
import route from '@router';
import cookieParser from 'cookie-parser';
import http from "http";
import { Server } from "socket.io";
import { swaggerDoc } from 'api-doc/swagger';
import swaggerUi from "swagger-ui-express";
import "dotenv/config";
import {setupNotificationSocket,botSocket, chatSocket} from '@socket';
import { initAllCronJobs, runStartupTasks } from '@helper/cron';


const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true); 
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token'],
    credentials: true,
  },
});
setupNotificationSocket(io);
botSocket(io);
chatSocket(io);


app.use(express.json());
app.use(body_parser.json({ limit: '50mb' }));
app.use(morgan('combined'));

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true); 
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);
app.use(cookieParser());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Node.js với TypeScript!');
});


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.use(apiLimiter);
route(app);

connectDatabase();

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  errorMiddleware(err, req, res, next);
});



server.listen(PORT, async () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
  // initAllCronJobs();
  // // Run startup tasks
  // await runStartupTasks();
});
