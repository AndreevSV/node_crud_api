import { User, NewUser } from '../models/userModel.js';
import { randomUUID } from 'node:crypto';
import repository from '../repositories/userRepository.js';

function getAllUsers(): User[] | undefined {
    return repository.getAllUsers();
}

function getUserById(id: string): User | undefined {
    return repository.getUserById(id);
}

function addNewUser(newUser: NewUser): User {
    const id = randomUUID();
    return repository.addNewUser(id, newUser);
}

function updateUser(id: string, newUser: NewUser) {
    return repository.updateUser(id, newUser);
}

function deleteUser(id: string) {
    return repository.deleteUser(id);

}

const userService = {
    getAllUsers,
    getUserById,
    addNewUser,
    updateUser,
    deleteUser,
};

export default userService;
