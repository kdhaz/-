import express from 'express';
import { createServer, Server} from 'http';

<<<<<<< HEAD
import controller from './controller'
=======
import controller from './controller';
>>>>>>> 7be73b4f37b7d4d1ca79bb59ef0192080f2d15c7

const app = express();

app.use(controller);

const server = createServer(app);
server.listen(process.env.PORT || 5000);