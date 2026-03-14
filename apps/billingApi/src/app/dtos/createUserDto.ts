export class CreateUserDto {
  name: string;

  email: string;

  password: string;

  account: string;

  role?: 'admin' | 'user';
}