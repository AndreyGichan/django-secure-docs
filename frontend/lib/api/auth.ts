import { API } from "./index";

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  full_name: string;
  email: string;
  password1: string;
  password2: string;
}

export const login = (data: LoginData) => API.post("users/login/", data);

export const register = (data: RegisterData) => API.post("users/register/", data);

export const logout = () => API.post("users/logout/");
