import { ProviderRegistration8Steps } from '@/components/registration/ProviderRegistration8Steps';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function ProviderRegister() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const handleRegistrationComplete = async (data: any) => {
    try {
      // Primeiro, verificar se o email já existe
      const checkEmailResponse = await fetch(`/api/auth/check-email?email=${encodeURIComponent(data.email)}`);
      if (checkEmailResponse.ok) {
        const emailExists = await checkEmailResponse.json();
        if (emailExists.exists) {
          throw new Error('Este email já está cadastrado. Tente fazer login ou use outro email.');
        }
      }

      // Criar usuário
      const userResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.fullName || data.name, // Use fullName from step 3 or fallback to name from step 2
          phone: data.phone,
          userType: 'provider',
          city: data.city,
          state: data.state,
        }),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.message || 'Erro ao criar usuário');
      }

      const user = await userResponse.json();

      // Criar perfil de prestador com token de autenticação
      const providerResponse = await fetch('/api/providers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          userId: user.user.id,
          cpfCnpj: data.cpf || data.cpfCnpj, // Use CPF from step 3
          city: data.city,
          state: data.state,
          basePrice: '0', // No base price in new flow
          description: data.description,
          experience: data.workingHours || '', // Use working hours as experience
          bankName: '', // Banking info removed from registration
          bankAgency: '',
          bankAccount: '',
          avatar: data.avatar,
          documentPhoto: data.documentPhoto,
          registrationStep: 8, // 8 steps completed
          status: 'pending', // Waiting for admin approval
          fullName: data.fullName,
          birthDate: data.birthDate,
          cnpj: data.cnpj,
          addressProof: data.addressProof,
          acceptedTerms: data.acceptedTerms,
          portfolioImages: data.portfolioImages ? JSON.stringify(data.portfolioImages) : null,
        }),
      });

      if (!providerResponse.ok) {
        throw new Error('Erro ao criar perfil de prestador');
      }

      const provider = await providerResponse.json();

      // Associar categoria de serviço
      await fetch('/api/provider-services', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          providerId: provider.id,
          categoryId: data.categoryId,
          description: data.description,
          price: '0', // No base price in new flow
        }),
      });

      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Seu perfil está sendo analisado pela nossa equipe. Você receberá um email quando for aprovado.',
      });

      setLocation('/login');
    } catch (error) {
      console.error('Erro no cadastro:', error);
      toast({
        title: 'Erro no cadastro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ProviderRegistration8Steps onComplete={handleRegistrationComplete} />
    </div>
  );
}