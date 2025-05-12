import { IncomingMessage, ServerResponse } from 'node:http';
import userService from '../services/userService.js';
import { NewUser } from '../models/userModel.js';


export async function userController(req: IncomingMessage, res: ServerResponse) {
    try {
        const { method, url } = req;

        if (!url?.startsWith('/api/users')) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Requested url doesn't exist` }));
            return;
        }

        const userId = getUserIdFromUrl(url);

        if (method === 'GET') {
            if (url === '/api/users') {
                const users = userService.getAllUsers();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(users));
                return;
            }

            if (url.startsWith('/api/users/')) {
                if (!userId || !isUUIDValid(userId)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid user ID' }));
                    return;
                }
                
                const user = userService.getUserById(userId);
                if (user) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(user));
                    return;
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'User not found' }));
                }
                return;
            } 
        }

        if (method === 'POST' && url === '/api/users') {
            const body = await getRequestBody(req);
            if (!validateUser(body)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request body' }));
                return;
            }

            const newUser = userService.addNewUser(body);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(newUser));
            return;
        }

        if (method === 'PUT' && url.startsWith('/api/users/')) {
            if (!userId || !isUUIDValid(userId)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid user ID' }));
                return;
            }

            const body = await getRequestBody(req);
            
            if (!validateUser(body)) {  
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request body' }));
                return;
            }

            const updatedUser = userService.updateUser(userId, body);
            if (updatedUser) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(updatedUser));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'User not found' }));
            }
            return;
        }
        
        if (method === 'DELETE' && url.startsWith('/api/users/')) {
            if (!userId || !isUUIDValid(userId)) {
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify("Invalid user ID"));
                return;
            }

            const deletedUser = userService.deleteUser(userId);

            if (deletedUser) {
                res.writeHead(204);
                res.end();
            } else {
                res.writeHead(404, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: "User not found"}));
            }
            return;
        }

        res.writeHead(405, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: "Method not allowed or invalid endpoint"}));
        
    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

function getUserIdFromUrl(url: string): string | null {
    const userIdMatch = url?.match(/\/api\/users\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);
    return userIdMatch ? userIdMatch[1] : null;

}

async function getRequestBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => body += chunk);
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}

function validateUser(user: any): user is NewUser {
    const isValid =
        typeof user.username === 'string' &&
        typeof user.age === 'number' &&
        Array.isArray(user.hobbies) &&
        user.hobbies.every((hobby: any) => typeof hobby === 'string');

    return isValid;
}

function isUUIDValid(
    id: string
): id is `${string}-${string}-${string}-${string}-${string}` {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
}