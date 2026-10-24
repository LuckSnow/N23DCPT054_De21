import express from 'express';
import cors from 'cors';
import { router } from './routes/api.js';
import { studentHeader, requestLog, errorHandler, HttpError } from './middlewares/common.js';
export const app = express();
app.use(studentHeader, requestLog, cors(), express.json());
app.use('/api', router);
app.use((req, res, next) => next(new HttpError(404, 'Không tìm thấy API.')));
app.use(errorHandler);
