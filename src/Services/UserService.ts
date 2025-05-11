import { UserModel, NewUser } from '../Models/UserModel';
import { randomUUID } from 'crypto';

export class UserService {
    private users: UserModel[] = [];

    public getUsers(): UserModel[] {
        return this.users;
    }

    public getUserById(id: string): UserModel | undefined {
        return this.users.find((user) => {
            user.id === id;
        });
    }

    public setUser(newUser: NewUser): UserModel {
        const user = {
            id: randomUUID(),
            ...newUser,
        };

        this.users.push(user);

        return user;
    }
}
