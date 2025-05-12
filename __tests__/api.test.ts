import http from 'node:http';
import { userController } from '../src/controllers/userController';
import '../src/db/init';

let server: http.Server;
const baseUrl = 'http://localhost:4000';

describe('CRUD API Tests', () => {
    beforeAll((done) => {
        server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
            try {
                await userController(req, res);
            } catch (error) {
                console.error(error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
        });

        server.listen(4000, () => {
            console.log('Test server is running on port 4000');
            done();
        });

        server.on('error', (error) => {
            console.error('Server error:', error);
        });

    }, 10000);


    afterAll((done) => {
        console.log('Closing test server');
        if(server && server.listening){
            server.close((error) => {
                if(error){
                    console.error('Error closing test server:', error);
                } else {
                    console.log('Test server closed');
                }
                done();
            });
        } else {
            console.log('Test server is not running');
        }
        done();
    }, 10000);

    async function makeRequest(method: string, path: string, body?: any):  Promise<{ statusCode: number; data: any }> {
        return new Promise((resolve, reject) => {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
            };
            const req = http.request(`${baseUrl}${path}`, options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                       resolve({
                        statusCode: res.statusCode || 500,
                        data: data ? JSON.parse(data) : null,
                    }); 
                } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', reject);

            if (body) {
                req.write(JSON.stringify(body));
            }
            req.end();
        })
    }

    it('should return array of existing 5 users', async () => {
        const response = await makeRequest('GET', '/api/users');
        expect(response.statusCode).toBe(200);
        expect(response.data).toBeInstanceOf(Array);
        expect(response.data.length).toBe(5);
    });

    it('should create a new user and return it', async () => {
        const newUser = {
            username: "NewUserTest",
            age: 65,
            hobbies: [
                "films"
            ]
        };

        const response = await makeRequest('POST', '/api/users', newUser);
        expect(response.statusCode).toBe(201);
        expect(response.data).toBeInstanceOf(Object);
        expect(response.data.username).toBe(newUser.username);
        expect(response.data.age).toBe(newUser.age);
        expect(response.data).toMatchObject({
            ...newUser,
            id: expect.any(String),
        });

        const createdUserId = response.data.id;

        const getUserResponse = await makeRequest('GET', `/api/users/${createdUserId}`);
        expect(getUserResponse.statusCode).toBe(200);
        expect(getUserResponse.data).toBeInstanceOf(Object);
        expect(getUserResponse.data.id).toBe(createdUserId);

        const updatedUser = {
            ...newUser,
            username: "UpdatedUserTest",
            age: 70,
        };

        const updateUserResponse = await makeRequest('PUT', `/api/users/${createdUserId}`, updatedUser);
        expect(updateUserResponse.statusCode).toBe(200);
        expect(updateUserResponse.data).toBeInstanceOf(Object);
        expect(updateUserResponse.data.id).toBe(createdUserId);
        expect(updateUserResponse.data).toMatchObject({
            ...updatedUser,
            id: createdUserId,
        });

        const deleteUserResponse = await makeRequest('DELETE', `/api/users/${createdUserId}`);
        expect(deleteUserResponse.statusCode).toBe(204);

        const getUserResponseAfterDelete = await makeRequest('GET', `/api/users/${createdUserId}`);
        expect(getUserResponseAfterDelete.statusCode).toBe(404);
    });

    it('should handle invalid user ID format correctly', async () => {
        const invalidId = 'invalid-uuid';
        const response = await makeRequest('GET', `/api/users/${invalidId}`);
        expect(response.statusCode).toBe(400);
    }, 10000);
});
