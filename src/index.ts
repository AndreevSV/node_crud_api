import 'dotenv/config';
import http, { OutgoingHttpHeaders, ServerResponse, IncomingMessage, IncomingHttpHeaders } from 'node:http';
import cluster from 'node:cluster';
import { cpus } from 'node:os';
import { userController } from './controllers/userController.js';
import './db/init.js';

interface WorkerMessage {
    type: 'request' | 'response';
    method?: string;
    url?: string;
    headers?: IncomingHttpHeaders;
    body?: string;
    statusCode?: number;
    req?: IncomingMessage;
}

const PORT = Number(process.env.PORT) || 4000;
const numberOfCores = cpus().length;

if (process.env.MODE === 'cluster' && cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);

    for (let i = 0; i < numberOfCores; i++) {
        cluster.fork({ PORT: PORT + i });
    }

    const server = http.createServer((req, res) => {
        const workers = Object.values(cluster.workers || {});
        const worker = workers[Math.floor(Math.random() * workers.length)];

        if (worker) {
            let body = '';
            req.on('data', (chunk) => body += chunk);
            req.on('end', () => {
                worker.send({
                    type: 'request',
                    method: req.method,
                    url: req.url,
                    headers: req.headers,
                    body: body
                });
            });
            worker.once('message', (message: WorkerMessage) => {
                if (message.type === 'response') {
                    res.writeHead(message.statusCode ?? 200, message.headers);
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
            if (message.type === 'request') {
                const artificialReq = new http.IncomingMessage(null as any);
                artificialReq.method = message.method;
                artificialReq.url = message.url ?? '';
                artificialReq.headers = message.headers ?? {} as IncomingHttpHeaders;

                if (message.body) {
                    const buffer = Buffer.from(message.body);
                    artificialReq.push(buffer);
                    artificialReq.push(null);

                    (artificialReq as any)._body = JSON.parse(message.body);
                }

                userController(artificialReq, {
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


