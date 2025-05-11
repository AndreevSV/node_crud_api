export interface UserModel {
    id: string;
    username: string;
    age: number;
    hobbies: string[];
}

export type NewUser = Omit<UserModel, 'id'>;