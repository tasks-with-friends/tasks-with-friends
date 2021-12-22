import express from 'express';
import * as auth from './auth';
import { middleware as scopeMiddleware } from 'ts-registry-express';
const serverless = require('serverless-http');

const app = express();
app.use(scopeMiddleware);
app.use(auth.middleware);

const router = express.Router();

router.use('/auth', auth.router);

router.get('/', (_, res) => res.json({ message: 'hello world' }));

app.use('/api', router);

const handler = serverless(app);

export { handler };
