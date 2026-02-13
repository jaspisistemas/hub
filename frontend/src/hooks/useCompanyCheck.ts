import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyService } from '../services/companyService';

export function useCompanyCheck() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkCompany = async () => {
      try {
        const company = await companyService.getMyCompany();
        if (!company || !company.id) {
          navigate('/onboarding/empresa', { replace: true });
        }
      } catch (error) {
        console.error('Erro ao verificar empresa:', error);
        // Se houver erro ao buscar, redireciona para onboarding
        navigate('/onboarding/empresa', { replace: true });
      }
    };

    checkCompany();
  }, [navigate]);
}
