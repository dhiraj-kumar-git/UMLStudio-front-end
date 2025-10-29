export interface LoginResponse {
  token: string;
  username: string;
  name: string;
}

export interface RegisterPayload {
  username: string;
  name: string;
  password: string;
  confirmPassword: string;
}

interface DummyUser {
  username: string;
  password: string;
  name: string;
}

export class AuthService {
  private users: DummyUser[] = [
    { username: "alice", password: "test123", name: "Alice Johnson" },
    { username: "bob", password: "test123", name: "Bob Smith" },
    { username: "charlie", password: "test123", name: "Charlie Brown" },
  ];

  async login(username: string, password: string): Promise<LoginResponse> {
    console.log("Authenticating locally...");

    await new Promise((resolve) => setTimeout(resolve, 600));

    const user = this.users.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      throw new Error("Invalid username or password");
    }

    const fakeToken = btoa(`${username}:${Date.now()}`);

    return {
      token: fakeToken,
      username: user.username,
      name: user.name,
    };
  }

  async register(data: RegisterPayload): Promise<void> {
    console.log("Registering new user locally...");
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (data.password !== data.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const exists = this.users.find((u) => u.username === data.username);
    if (exists) {
      throw new Error("Username already exists");
    }

    this.users.push({
      username: data.username,
      password: data.password,
      name: data.name,
    });

    console.log("User registered:", data.username);
  }
}
