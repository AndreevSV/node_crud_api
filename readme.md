# CRUD API

A simple CRUD API implementation using Node.js and TypeScript with in-memory database.

## Setup and Installation

1. Clone the repository
2. Install dependencies:
```
npm install
```
3. Create `.env` file in the root directory:
```
PORT=4000
```

## Running the Application

There are three modes available to run the application:

1. Development mode (with hot reload):
```
npm run start:dev
```

2. Production mode:
```
npm run start:prod
```

3. Multi-threaded mode (with load balancer):
```
npm run start:multi
```

## API Endpoints

Base URL: `http://localhost:4000/api`

### GET /users
- Returns all users
- Response: 200 OK with array of users

### GET /users/{userId}
- Returns specific user by ID
- Response: 
  - 200 OK with user data
  - 400 Bad Request if invalid UUID
  - 404 Not Found if user doesn't exist

### POST /users
- Creates new user
- Required fields in request body:
  ```json
  {
    "username": "string",
    "age": number,
    "hobbies": string[]
  }
  ```
- Response:
  - 201 Created with new user data
  - 400 Bad Request if missing required fields

### PUT /users/{userId}
- Updates existing user
- Same body format as POST
- Response:
  - 200 OK with updated user data
  - 400 Bad Request if invalid UUID
  - 404 Not Found if user doesn't exist

### DELETE /users/{userId}
- Deletes user by ID
- Response:
  - 204 No Content on success
  - 400 Bad Request if invalid UUID
  - 404 Not Found if user doesn't exist

## Error Handling

- 404: Not Found - When accessing non-existing endpoints
- 400: Bad Request - When request validation fails
- 500: Internal Server Error - For server-side errors

## Multi-Threading Support

When running in multi-threaded mode (`npm run start:multi`):
- Load balancer runs on base port (default: 4000)
- Worker instances run on consecutive ports (4001, 4002, etc.)
- Requests are distributed using Round-robin algorithm
- Database state remains consistent across all workers

## Testing

Run the test suite:
```
npm test
```

Test scenarios include:
1. Getting all users (empty array initially)
2. Creating new user
3. Retrieving created user
4. Updating user
5. Deleting user
6. Verifying deletion

## Technical Details

- Node.js version: 22.x.x or higher
- TypeScript implementation
- In-memory database
- UUID v4 for unique identifiers
- Asynchronous API implementation

## Dependencies

### Production Dependencies
- dotenv: ^16.5.0

### Development Dependencies
- @types/jest: ^29.5.14
- @types/node: ^22.15.17
- @types/uuid: ^9.0.8
- cross-env: ^7.0.3
- jest: ^29.7.0
- nodemon: ^3.1.10
- ts-jest: ^29.3.2
- ts-node: ^10.9.2
- typescript: ^5.8.3