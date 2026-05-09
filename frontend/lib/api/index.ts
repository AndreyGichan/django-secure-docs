import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:8000/api/",
  withCredentials: true,
});

// API.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       window.location.href = "/login";
//     }

//     return Promise.reject(error);
//   }
// );

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
       error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("token/refresh")
    ) {
      originalRequest._retry = true;

      try {
        await API.post("users/token/refresh/");

        return API(originalRequest);
      } catch (refreshError) {
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// let isRefreshing = false;
// let failedQueue: { resolve: (value?: any) => void; reject: (err: any) => void }[] = [];

// const processQueue = (error: any, token: any = null) => {
//   failedQueue.forEach((prom) => {
//     if (error) {
//       prom.reject(error);
//     } else {
//       prom.resolve(token);
//     }
//   });
//   failedQueue = [];
// };

// API.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         return new Promise(function (resolve, reject) {
//           failedQueue.push({ resolve, reject });
//         })
//           .then(() => API(originalRequest))
//           .catch((err) => Promise.reject(err));
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         await API.post("users/token/refresh/");

//         processQueue(null); 
//         return API(originalRequest);
//       } catch (err) {
//         processQueue(err, null);
//         window.location.href = "/login"; 
//         return Promise.reject(err);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(error);
//   }
// );