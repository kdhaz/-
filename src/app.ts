import express from 'express';
import { createServer, Server} from 'http';

import controller from './controller'

const app = express();

app.use(controller);

const server = createServer(app);
server.listen(process.env.PORT || 5000);