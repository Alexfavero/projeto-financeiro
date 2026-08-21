import { api } from "@/lib/api";
import type { LoginModel, RegisterModel, Response as ApiResponse, TokenModel } from "@/types/dtos";

export async function login(credentials: LoginModel): Promise<TokenModel> {
  const { data } = await api.post<TokenModel>("/Auth/login", credentials);
  return data;
}

export async function register(payload: RegisterModel): Promise<ApiResponse> {
  const { data } = await api.post<ApiResponse>("/Auth/register", payload);
  return data;
}
