import db from '../db/database';
import { randomUUID } from 'node:crypto';

db.exec(`
  CREATE TABLE IF NOT EXISTS users(
    id TEXT UNIQUE NOT NULL, 
    username TEXT NOT NULL, 
    age INTEGER NOT NULL, 
    hobbies TEXT NOT NULL; 
`);

const users = [
    {
        id: randomUUID(),
        username: 'Alfred',
        age: 22,
        hobbies: JSON.stringify(['tennis']),
    },
    {
        id: randomUUID(),
        username: 'Sway',
        age: 25,
        hobbies: JSON.stringify(['fishing', "basketball"]),
    },
    {
        id: randomUUID(),
        username: 'Stive',
        age: 20,
        hobbies: JSON.stringify([]),
    },
    {
        id: randomUUID(),
        username: 'Line',
        age: 30,
        hobbies: JSON.stringify(['bodybuilding']),
    },
    {
        id: randomUUID(),
        username: 'Omelia',
        age: 18,
        hobbies: JSON.stringify(['pig-pong', 'swimming']),
    },
];

const insertStmt = db.prepare(`
        INSERT INTO users (id, username, age, hobbies) VALUES (?, ?, ?, ?);
    `);

users.forEach((user) => {
    insertStmt.run(user.id, user.username, user.age, user.hobbies);
});

if (db) db.close();

export { users };