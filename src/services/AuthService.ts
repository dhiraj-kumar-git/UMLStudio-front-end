import axios from "axios";
import { API_BASE, ENDPOINTS } from "../api.config";

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
   
    const url = API_BASE + (ENDPOINTS.auth.login || "/auth/login");
    const { data: user } = await axios.post<LoginResponse>(url, { username, password });

    return {
      token: user.token,
      message: user.message,
      status: user.status
    };
  }

  async register(data: RegisterPayload): Promise<void> {
    const url = API_BASE + (ENDPOINTS.auth.register || "/auth/register");
    const { data: exists } = await axios.post(url, data);
    if (exists.status === "FAILED") {
      throw new Error("Username already exists");
    }

    console.log("User registered:", data.username);
  }
}
