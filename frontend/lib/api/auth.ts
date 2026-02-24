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
  public_key: string,
}

export const login = (data: { email: string; password: string }) =>
  API.post("users/login/", data);
export const register = (data: RegisterData) => API.post("users/register/", data);
export const logout = () => API.post("users/logout/");
export const getCurrentUser = () => API.get("users/profile/");
export const searchUsers = (query: string) =>
  API.get("users/search/", {
    params: { search: query },
  });
export const updateUserPublicKey = (publicKey: string) =>
  API.patch("users/me/", { public_key: publicKey })