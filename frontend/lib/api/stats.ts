import { API } from "./index";

export const getUserStats = () => API.get("/users/stats/");
