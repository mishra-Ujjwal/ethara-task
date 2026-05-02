import api from "./axios";

export const getAllTeamsApi = () => api.get("/teams");
export const getMyTeamApi  = () => api.get("/teams/my-team");