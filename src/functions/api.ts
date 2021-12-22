import express from 'express';
const serverless = require('serverless-http');

const app = express();

const router = express.Router();

router.get('/test/more', (_, res) => res.json({ message: 'hella whirled' }));
router.get('/test', (_, res) => res.json({ message: 'hello world' }));
router.get('/', (_, res) => res.json({ message: 'hw' }));

app.use('/api', router);

const handler = serverless(app);

export { handler };
