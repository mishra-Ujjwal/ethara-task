import api from "./axios";

export const getAllUsersApi  = (role) => api.get("/users", { params: role ? { role } : {} });
export const getUserByIdApi  = (id)   => api.get(`/users/${id}`);
export const createUserApi   = (data) => api.post("/users", data);
export const updateUserApi   = (id, data) => api.put(`/users/${id}`, data);
export const deleteUserApi   = (id)   => api.delete(`/users/${id}`);