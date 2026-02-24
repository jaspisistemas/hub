import { API_BASE_URL, getApiBaseUrl } from './api';

const API_URL = getApiBaseUrl();

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
});

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    companyId?: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface RegisterResponse {
  message: string;
  verificationUrl?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export const authService = {
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao registrar');
    }

    return response.json();
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/auth/verify-email/${token}`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    const rawText = await response.text();

    const parseJson = () => {
      try {
        return JSON.parse(rawText);
      } catch (parseError) {
        return null;
      }
    };

    if (!response.ok) {
      const parsed = parseJson();
      const message = parsed?.message || rawText || 'Erro ao verificar email';
      throw new Error(message);
    }

    const parsed = parseJson();
    if (parsed?.message) {
      return { message: parsed.message };
    }

    return { message: rawText || 'Email verificado com sucesso' };
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao fazer login');
    }

    return response.json();
  },

  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  setToken(token: string): void {
    localStorage.setItem('authToken', token);
  },

  removeToken(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};
