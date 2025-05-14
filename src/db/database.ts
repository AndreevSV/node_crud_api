import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('file:memdb1?mode=memory&cache=shared');

export default db;