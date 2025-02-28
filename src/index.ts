import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import body_parser from 'body-parser';
import morgan from 'morgan';
import { connectDatabase } from '@models/connect';
import { errorMiddleware,apiLimiter } from '@middleware';
import route from '@router';
import cookieParser from 'cookie-parser'
import { swaggerDoc } from 'api-doc/swagger';
import swaggerUi from "swagger-ui-express";
import "dotenv/config";
import {checkAndUpdatePostsOnStartup} from '@helper';


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(body_parser.json({ limit: '50mb' }));
app.use(morgan('combined'));

app.use(
  cors({
    origin: ['*'],
    credentials: true,
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


app.listen(PORT,async  () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  await checkAndUpdatePostsOnStartup();
});
