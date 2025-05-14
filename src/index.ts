import 'dotenv/config';
import http, { IncomingMessage, ServerResponse } from 'node:http';
import cluster from 'node:cluster';
import { cpus } from 'node:os';
import { userController } from './controllers/userController.js';
import './db/init.js';

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

const PORT = Number(process.env.PORT) || 4000;
const numberOfCores = cpus().length;

process.on('SIGINT', () => {
    console.log('Shutting down...');
    if (cluster.isPrimary) {
        Object.values(cluster.workers || {}).forEach(worker => {
            worker?.kill();
        });
    }
    process.exit(0);
})

if (process.env.MODE === 'cluster' && cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);

    let currentWorkerIndex = 0;
    const workerPorts = new Map<number, number>();
    let workersReady = 0;

    const startServer = () => {
        server.listen(PORT, () => {
            console.log(`Load balancer listening on port ${PORT}`);
        });
    };

    for (let i = 0; i < numberOfCores; i++) {
        const workerPort = PORT + i + 1;
        const worker = cluster.fork({ PORT: workerPort });
        workerPorts.set(worker.id, workerPort);

        worker.on('message', (message) => {
            if (message === 'ready') {
                workersReady++;
                console.log(`Worker ${worker.id} is ready`);
                if (workersReady === numberOfCores) {
                    startServer();
                }
            }
        });
    }

    const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {

        const validPath = /^\/api\/users(\/[a-f0-9-]{36})?$/i;

        if (!req.url || !validPath.test(req.url)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid endpoint' }));
            return;
        }

        const workers = Object.values(cluster.workers || {});

        if (workers.length === 0) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No workers available' }));
            return;
        }

        const worker = workers[currentWorkerIndex];

        if (!worker) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No workers available' }));
            return;
        }

        currentWorkerIndex = (currentWorkerIndex + 1) % workers.length;

        const workerPort = workerPorts.get(worker.id);

        if (!workerPort) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Worker port not found' }));
            return;
        }

        const options = {
            hostname: 'localhost',
            port: workerPort,
            path: req.url || '/',
            method: req.method,
            headers: {
                ...req.headers,
                'x-forwarded-host': req.headers.host || 'localhost',
                'x-forwarded-for': req.socket.remoteAddress || ''
            }
        };

        console.log(`Forwarding ${req.method} request to worker on port ${workerPort}`);

        const proxyReq = http.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (error) => {
            console.error(`Proxy request error to worker on port ${workerPort}:`, error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        });

        req.pipe(proxyReq);
    });

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        const deadPort = workerPorts.get(worker.id);
        workerPorts.delete(worker.id);
        if (deadPort) {
            const newWorker = cluster.fork({ PORT: deadPort });
            workerPorts.set(newWorker.id, deadPort);
        }
    });

} else {
    const server = http.createServer((req, res) => {
        userController(req, res);
    });

    const serverPort = Number(process.env.PORT);
    server.listen(serverPort, () => {
        console.log(`Worker ${process.pid} running on port ${serverPort}`);
        if (process.send) {
            process.send('ready');
        }
    });
}


