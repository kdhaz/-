import express from 'express';
import { createServer, Server } from 'http';
import bodyParser from 'body-parser';

import controller from './controller';
import { initWebSocket } from './middleware/socket';

const app = express();

app.use(bodyParser.json());
app.use(controller);

const server: Server = createServer(app);
initWebSocket(server);

server.listen(process.env.PORT || 5000, () => {
  console.log('server initialized');
});
