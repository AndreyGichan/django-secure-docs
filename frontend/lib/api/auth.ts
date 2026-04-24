import { API } from "./index";

interface RegisterData {
  full_name: string;
  email: string;
  password1: string;
  password2: string;
  public_key: string,
}

interface SearchUsersParams {
  search?: string;
  limit?: number;
  offset?: number;
  role?: string;
}

export const login = (data: { email: string; password: string }) =>
  API.post("users/login/", data);
export const register = (data: RegisterData) => API.post("users/register/", data);
export const logout = () => API.post("users/logout/");
export const getCurrentUser = () => API.get("users/profile/");
export const searchUsers = (params: SearchUsersParams) =>
  API.get("users/", { params });
export const updateUserPublicKey = (publicKey: string) =>
  API.patch("users/profile/", { public_key: publicKey })
export const changePassword = (oldPassword: string, newPassword: string, confirmPassword: string) =>
  API.post("users/change-password/", { old_password: oldPassword, new_password: newPassword, confirm_password: confirmPassword });
