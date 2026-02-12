import { apiFetch } from './api';

export const profileService = {
  getProfile: async () => {
    return await apiFetch('/auth/profile', {
      method: 'GET',
    });
  },

  updateProfile: async (data: {
    name?: string;
    phone?: string;
    role?: string;
    companyName?: string;
    cnpj?: string;
    address?: string;
    avatarUrl?: string;
    logoUrl?: string;
  }) => {
    return await apiFetch('/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    return await apiFetch('/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  updatePreferences: async (data: {
    theme?: string;
    language?: string;
    currency?: string;
    notificationsEmail?: boolean;
    notificationsSystem?: boolean;
    defaultDashboardPeriod?: number;
  }) => {
    return await apiFetch('/auth/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
};
