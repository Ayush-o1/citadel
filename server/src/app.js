import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env, isProduction } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { attachUser } from './middleware/auth.js';

export const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(attachUser);
app.use(morgan(isProduction ? 'combined' : 'dev'));

app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);
