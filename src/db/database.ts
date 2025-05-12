import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:');

export default db;