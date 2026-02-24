import { apiFetch } from './api';

export interface CompanyMember {
  id: string;
  email: string;
  role: 'admin' | 'member';
  acceptedAt?: string;
  inviteSentAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface InvitePayload {
  email: string;
  role: 'admin' | 'member';
}

export interface InviteResponse {
  member: CompanyMember;
  inviteToken: string;
}

const collaboratorsService = {
  // Buscar membros da empresa
  async getMembers(companyId: string): Promise<CompanyMember[]> {
    return apiFetch(`/companies/${companyId}/members`, {
      method: 'GET',
    });
  },

  // Convidar novo colaborador
  async inviteMember(companyId: string, data: InvitePayload): Promise<InviteResponse> {
    return apiFetch(`/companies/${companyId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  // Atualizar função do colaborador
  async updateMemberRole(
    memberId: string,
    role: 'admin' | 'member'
  ): Promise<CompanyMember> {
    return apiFetch(`/companies/members/${memberId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
  },

  // Remover colaborador
  async removeMember(memberId: string): Promise<void> {
    await apiFetch(`/companies/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  // Aceitar convite
  async acceptInvite(inviteToken: string): Promise<any> {
    return apiFetch(`/companies/invite/${inviteToken}`, {
      method: 'POST',
      needsAuth: false,
      suppressAuthRedirect: true,
    });
  },
};

export default collaboratorsService;
