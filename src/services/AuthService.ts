import axios from "axios";

export interface LoginResponse {
  token: string;
  message: string;
  status: string;
}

export interface RegisterPayload {
  username: string;
  name: string;
  password: string;
  confirmPassword: string;
}

export class AuthService {

  async login(username: string, password: string): Promise<LoginResponse> {
   
    const { data: user } = await axios.post<LoginResponse>(
      "https://uml-studio.onrender.com/auth/login",
      { username, password }
    );

    return {
      token: user.token,
      message: user.message,
      status: user.status
    };
  }

  async register(data: RegisterPayload): Promise<void> {
    const { data: exists } = await axios.post(
      "https://uml-studio.onrender.com/auth/register",
      data
    );
    if (exists.status === "FAILED") {
      throw new Error("Username already exists");
    }

    console.log("User registered:", data.username);
  }
}
