import { AuthService, type RegisterPayload } from "../services/AuthService";
import toast from "react-hot-toast";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async handleLogin(
    username: string,
    password: string,
    setToken: (token: string | null) => void,
    navigate: (path: string) => void,
    setError: (message: string | null) => void
  ): Promise<void> {
    try {
      setError(null);
      const data = await this.authService.login(username, password);
      localStorage.setItem("jwt", data.token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("name", data.name);
      toast.success(`Welcome, ${data.name}!`);
      setToken(data.token);
      navigate("/home");
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    }
  }

  async handleRegister(
    data: RegisterPayload,
    navigate: (path: string) => void,
    setError: (message: string | null) => void
  ): Promise<void> {
    try {
      setError(null);
      await this.authService.register(data);
      toast.success("Account created successfully!");
      navigate("/login");
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    }
  }
}
