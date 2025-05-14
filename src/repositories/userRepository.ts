import { SQLOutputValue } from 'node:sqlite';
import db from '../db/database.js';
import { User, NewUser } from '../models/userModel.js';

function getAllUsers(): User[] | undefined {
    const stmt = db.prepare(`SELECT * FROM users;`);

    return stmt.all().map((record) => {
        return convertSQLRecordToUser(record);
    });
}

function getUserById(id: string): User | undefined {
    const stmt = db.prepare(`SELECT * FROM users where id=?`);

    const record = stmt.get(id);
    return record ? convertSQLRecordToUser(record) : undefined;
}

function addNewUser(id: string, { username, age, hobbies }: NewUser): User {
    const stmt = db.prepare(`
        INSERT INTO users (id, username, age, hobbies) VALUES (?, ?, ?, ?)
        `);

    stmt.run(id, username, age, JSON.stringify(hobbies));

    return { id, username, age, hobbies };
}

function updateUser(
    id: string,
    { username, age, hobbies }: NewUser
): User | undefined {
    const stmt = db.prepare(`
        UPDATE users SET username = ?, age = ?, hobbies = ? WHERE id = ?
        `);
    const { changes } = stmt.run(username, age, JSON.stringify(hobbies), id);

    if (changes == 1) {
        return { id, username, age, hobbies };
    } else {
        return undefined;
    }
}

function deleteUser(id: string): number | bigint | undefined {
    const stmt = db.prepare(`
        DELETE FROM users WHERE id = ?
        `);
    const { changes } = stmt.run(id);
    
    if (changes == 1) {
        return changes;
    } else {
        return undefined;
    } 
}

function convertSQLRecordToUser(record: Record<string, SQLOutputValue>): User {
    return {
        id: record?.id!.toString(),
        username: record?.username!.toString(),
        age: Number(record?.age),
        hobbies: JSON.parse(String(record.hobbies || [])),
    };
}

const repository = {
    getAllUsers,
    getUserById,
    addNewUser,
    updateUser,
    deleteUser,
};

export default repository;
