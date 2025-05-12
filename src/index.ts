import 'dotenv/config';
import http, { OutgoingHttpHeaders, ServerResponse, IncomingMessage} from 'node:http';
import cluster from 'node:cluster';
import { cpus } from 'node:os';
import { userController } from './controllers/userController.js';

interface WorkerMessage {
    type: 'request' | 'response';
    req?: IncomingMessage;
    statusCode?: number;
    headers?: OutgoingHttpHeaders;
    body?: string;
}

const PORT = Number(process.env.PORT) || 4000;
const numberOfCores = cpus().length;

if (process.env.MODE === 'cluster' && cluster.isPrimary) {

    for (let i = 0; i < numberOfCores; i++) {
        cluster.fork({ PORT: PORT + i });
    }

    const server = http.createServer((req, res) => {
        const workers = Object.values(cluster.workers || {});
        const worker = workers[Math.floor(Math.random() * workers.length)];

        if (worker) {
            worker.send({ type: 'request', req });
            worker.on('message', (message) => {
                if (message.type === 'response') {
                    res.writeHead(message.statusCode, message.headers);
                    res.end(message.body);
                }
            });
        } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'No workers available' }));
        }

    });

    server.listen(PORT, () => {
        console.log('Load balancer on port', PORT)
    });

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork();
    });

} else {
    const server = http.createServer((req, res) => {
        userController(req, res);
    });

    server.listen(PORT, () => {
        console.log('Server started on port', PORT)
    });

    if (cluster.isWorker) {
        process.on('message', (message: WorkerMessage) => {
            if (message.type === 'request' && message.req) {
                userController(message.req, {
                    writeHead: (statusCode: number, headers?: OutgoingHttpHeaders) => {
                        process.send?.({
                            type: 'response',
                            statusCode,
                            headers,
                            body: ''
                        } as WorkerMessage);
                    },
                    end: (body: string) => {
                        process.send?.({
                            type: 'response',
                            body,
                            
                        } as WorkerMessage);
                    }
                } as ServerResponse);
            }
        })
    }
}


