import { ProviderRegistrationWizard } from '@/components/registration/ProviderRegistrationWizard';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function ProviderRegister() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const handleRegistrationComplete = async (data: any) => {
    try {
      // Criar usuário
      const userResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone,
          userType: 'provider',
          city: data.city,
          state: data.state,
        }),
      });

      if (!userResponse.ok) {
        throw new Error('Erro ao criar usuário');
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
          cpfCnpj: data.cpfCnpj,
          city: data.city,
          state: data.state,
          basePrice: data.basePrice,
          description: data.description,
          experience: data.experience,
          bankName: data.bankName,
          bankAgency: data.bankAgency,
          bankAccount: data.bankAccount,
          avatar: data.avatar,
          registrationStep: 3, // Completado
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
          price: data.basePrice,
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
      <ProviderRegistrationWizard onComplete={handleRegistrationComplete} />
    </div>
  );
}