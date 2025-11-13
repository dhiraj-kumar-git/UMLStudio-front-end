import axios from "axios";

export interface LoginResponse {
  message: string;
  status: string;
  token: string;
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
  async login(username: string, password: string): Promise<LoginResponse> {
    const { data: user } = await axios.post<LoginResponse>(
      "http://localhost:8080/auth/login",
      { username, password }
    );

    if (!user) {
      throw new Error("Invalid username or password");
    }

    return {
      token: user.token,
      message: user.message,
      status: user.status,
    };
  }

  async register(data: RegisterPayload): Promise<void> {
    const { data: exists } = await axios.post(
      "http://localhost:8080/auth/register",
      data
    );
    if (exists.status == "FAILED") {
      throw new Error("Username already exists");
    }

    console.log("User registered:", data.username);
  }
}
