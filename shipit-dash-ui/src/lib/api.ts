const DEFAULT_API_URL = "http://localhost:5001";
const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;

const API_BASE_URL = (env?.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const responseText = await response.text();
  const responseData = responseText ? safeParseJson(responseText) : null;

  if (!response.ok) {
    const message =
      typeof responseData === "object" && responseData && "message" in responseData
        ? String((responseData as { message?: string }).message)
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, responseData);
  }

  return responseData as T;
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export { API_BASE_URL };

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user_id: string;
  message?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user_id: string;
  username: string;
  message?: string;
}

export interface DeploymentRequestPayload {
  user_id: string;
  repo_url: string;
  ssh_details: {
    hostname: string;
    username: string;
    private_key: string;
  };
}

export interface DeploymentResponse {
  deployment_id: string;
  status?: string;
  message?: string;
}

export interface DeploymentRecord {
  id?: string;
  userId?: string;
  repo_url?: string;
  server_ip_address?: string;
  status?: string;
  celery_task_id?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiRequest<RegisterResponse>("/api/auth/register", {
      method: "POST",
      body: payload,
    }),
  login: (payload: LoginPayload) =>
    apiRequest<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: payload,
    }),
};

export const deployApi = {
  trigger: (payload: DeploymentRequestPayload) =>
    apiRequest<DeploymentResponse>("/api/deploy/", {
      method: "POST",
      body: payload,
    }),
  byUser: (userId: string) => apiRequest<DeploymentRecord[]>(`/api/deploy/${userId}`),
};
