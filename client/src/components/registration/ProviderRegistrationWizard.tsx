import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { RegistrationImageUpload } from '@/components/registration/RegistrationImageUpload';
import { OpenStreetMapLocationPicker } from '@/components/location/OpenStreetMapLocationPicker';
import { User, Phone, Mail, CreditCard, Briefcase, Camera, Building2, MapPin, FileText, Upload, Shield, Banknote, Clock } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { extractAddressComponents } from '@/lib/addressUtils';
import { validateCpfCnpj, formatCpfCnpj, getCpfCnpjErrorMessage } from '@/utils/cpf-validator';
import { validatePhone, formatPhone, getPhoneErrorMessage } from '@/utils/phone-validator';

// Schemas para cada passo
// Step 1: Criar Conta
const step1Schema = z.object({
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório').refine(validatePhone, 'Número de telefone inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

// Step 2: Informações do Prestador
const step2Schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  categoryId: z.number().min(1, 'Selecione uma categoria'),
  workingHours: z.string().min(5, 'Informe o horário de funcionamento'),
});

// Step 3: Dados do Responsável Legal
const step3Schema = z.object({
  fullName: z.string().min(2, 'Nome completo é obrigatório'),
  cpf: z.string().min(1, 'CPF é obrigatório').refine(validateCpfCnpj, 'CPF inválido'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
});

// Step 4: Documentação
const step4Schema = z.object({
  documentPhoto: z.string().min(1, 'Foto do documento é obrigatória'),
  cnpj: z.string().optional(),
  addressProof: z.string().optional(),
});

// Step 5: Plano de Parceria
const step5Schema = z.object({
  acceptedTerms: z.boolean().refine(val => val === true, 'Você deve aceitar os termos'),
});

// Step 6: Personalização do Perfil
const step6Schema = z.object({
  avatar: z.string().optional(),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  portfolioImages: z.array(z.string()).optional(),
});

// Step 7: Aprovação (apenas informativo)
const step7Schema = z.object({
  acknowledged: z.boolean().refine(val => val === true, 'Confirme que entendeu o processo'),
});

// Step 8: Configuração de Pagamentos (apenas informativo)
const step8Schema = z.object({
  acknowledged: z.boolean().refine(val => val === true, 'Confirme que configurará os pagamentos'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;
type Step5Data = z.infer<typeof step5Schema>;
type Step6Data = z.infer<typeof step6Schema>;
type Step7Data = z.infer<typeof step7Schema>;
type Step8Data = z.infer<typeof step8Schema>;

interface ProviderRegistrationWizardProps {
  onComplete: (data: any) => void;
}

export function ProviderRegistrationWizard({ onComplete }: ProviderRegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationData, setRegistrationData] = useState<any>({});
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const { selectedCity, setSelectedCity } = useLocation();
  const { toast } = useToast();

  // Carregar categorias
  const { data: categories = [] } = useQuery<Array<{id: number, name: string}>>({
    queryKey: ['/api/categories'],
  });

  const steps = [
    { 
      title: "Criar Conta", 
      description: "E-mail e senha", 
      icon: User 
    },
    { 
      title: "Informações do Prestador", 
      description: "Nome e categoria", 
      icon: Briefcase 
    },
    { 
      title: "Dados do Responsável", 
      description: "CPF e nascimento", 
      icon: FileText 
    },
    { 
      title: "Documentação", 
      description: "RG/CNH e CNPJ", 
      icon: Upload 
    },
    { 
      title: "Plano de Parceria", 
      description: "Comissão 7% + 3,2%", 
      icon: CreditCard 
    },
    { 
      title: "Personalização", 
      description: "Perfil e galeria", 
      icon: Camera 
    },
    { 
      title: "Aprovação", 
      description: "Revisão admin", 
      icon: Shield 
    },
    { 
      title: "Pagamentos", 
      description: "Contas e PIX", 
      icon: Banknote 
    }
  ];

  // Salvar rascunho automaticamente
  const saveDraft = (data: any) => {
    const draftData = { ...registrationData, ...data, currentStep };
    setRegistrationData(draftData);
    localStorage.setItem('providerRegistrationDraft', JSON.stringify(draftData));
  };

  // Lidar com seleção de localização
  const handleLocationSet = (location: { lat: number; lng: number; address: string }) => {
    const addressComponents = extractAddressComponents(location.address);
    const cityState = {
      city: addressComponents.city,
      state: addressComponents.state
    };
    
    setSelectedCity(cityState);
    setIsLocationModalOpen(false);
    
    toast({
      title: 'Localização selecionada',
      description: `${cityState.city} - ${cityState.state}`,
    });
  };

  // Check phone uniqueness
  const { data: phoneCheck, isLoading: checkingPhone } = useQuery({
    queryKey: ['/api/auth/check-phone', registrationData.phone],
    enabled: !!registrationData.phone && validatePhone(registrationData.phone),
    queryFn: async () => {
      const response = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(registrationData.phone)}`);
      return response.json();
    },
  });

  // Step 1: Criar Conta
  const Step1Form = () => {
    const form = useForm<Step1Data>({
      resolver: zodResolver(step1Schema),
      defaultValues: {
        email: registrationData.email || '',
        phone: registrationData.phone || '',
        password: registrationData.password || '',
        confirmPassword: registrationData.confirmPassword || '',
      },
    });

    const onSubmit = async (data: Step1Data) => {
      // Check phone uniqueness before proceeding
      try {
        const response = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(data.phone)}`);
        const phoneCheckResult = await response.json();
        
        if (phoneCheckResult.exists) {
          form.setError('phone', { 
            message: 'Este número de telefone já está cadastrado' 
          });
          return;
        }
        
        saveDraft(data);
        setCurrentStep(2);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao verificar o telefone. Tente novamente.',
          variant: 'destructive'
        });
      }
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold mb-2">Criar sua conta de prestador</h2>
              <p className="text-gray-600">Informe seu e-mail e telefone para começar</p>
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="seu@email.com" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="(11) 99999-9999" 
                        className="pl-10" 
                        {...field}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Crie uma senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirme sua senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <div />
            <Button type="submit">Próximo Passo</Button>
          </div>
        </form>
      </Form>
    );
  };

  // Step 2: Informações do Prestador
  const Step2Form = () => {
    const form = useForm<Step2Data>({
      resolver: zodResolver(step2Schema),
      defaultValues: {
        name: registrationData.name || '',
        categoryId: registrationData.categoryId || 0,
        workingHours: registrationData.workingHours || '',
      },
    });

    const onSubmit = (data: Step2Data) => {
      saveDraft(data);
      setCurrentStep(3);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria de Serviço</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua especialidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição dos Serviços</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva os serviços que você oferece..."
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experiência Profissional</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Conte sobre sua experiência na área..."
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço Base (R$)</FormLabel>
                <FormControl>
                  <Input placeholder="100.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
              Voltar
            </Button>
            <Button type="submit">Próximo Passo</Button>
          </div>
        </form>
      </Form>
    );
  };

  const Step3Form = () => {
    const form = useForm<Step3Data>({
      resolver: zodResolver(step3Schema),
      defaultValues: {
        avatar: registrationData.avatar || '',
        documentPhoto: registrationData.documentPhoto || '',
      },
    });

    const onSubmit = (data: Step3Data) => {
      saveDraft(data);
      setCurrentStep(4);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Foto de Perfil ou Logo</FormLabel>
                <FormControl>
                  <RegistrationImageUpload
                    value={field.value || ''}
                    onChange={field.onChange}
                    folder="providers"
                    acceptedFormats={['.jpg', '.jpeg', '.png']}
                    maxSizeMB={5}
                    placeholder="Envie sua foto de perfil ou logo"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="documentPhoto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Documento com Foto (RG/CNH)</FormLabel>
                <FormControl>
                  <RegistrationImageUpload
                    value={field.value || ''}
                    onChange={field.onChange}
                    folder="documents"
                    acceptedFormats={['.jpg', '.jpeg', '.png']}
                    maxSizeMB={5}
                    placeholder="Envie seu documento com foto (RG/CNH)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
              Voltar
            </Button>
            <Button type="submit">Próximo Passo</Button>
          </div>
        </form>
      </Form>
    );
  };

  const Step4Form = () => {
    const form = useForm<Step4Data>({
      resolver: zodResolver(step4Schema),
      defaultValues: {
        bankName: registrationData.bankName || '',
        bankAgency: registrationData.bankAgency || '',
        bankAccount: registrationData.bankAccount || '',
      },
    });

    const onSubmit = (data: Step4Data) => {
      const completeData = { 
        ...registrationData, 
        ...data,
        city: selectedCity?.city,
        state: selectedCity?.state,
      };
      localStorage.removeItem('providerRegistrationDraft');
      onComplete(completeData);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banco</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do banco" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankAgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agência</FormLabel>
                  <FormControl>
                    <Input placeholder="0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankAccount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta</FormLabel>
                  <FormControl>
                    <Input placeholder="00000-0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>
              Voltar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Finalizar Cadastro
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  if (!selectedCity) {
    return (
      <>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Selecione sua Localização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Para se cadastrar como prestador, primeiro você precisa selecionar sua cidade.
            </p>
            <Button 
              onClick={() => setIsLocationModalOpen(true)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Selecionar Cidade
            </Button>
          </CardContent>
        </Card>

        <OpenStreetMapLocationPicker
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onLocationSelect={handleLocationSet}
        />
      </>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Cadastro de Prestador</h1>
          <span className="text-sm text-gray-500">
            Cidade: {selectedCity.city} - {selectedCity.state}
          </span>
        </div>
        
        <Progress value={(currentStep / 8) * 100} className="mb-4" />
        
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            const Icon = step.icon;

            return (
              <div
                key={stepNumber}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isActive
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : isCompleted
                    ? 'border-green-300 bg-green-50 text-green-600'
                    : 'border-gray-200 text-gray-500'
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isActive || isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-xs opacity-75">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && <Step1Form />}
          {currentStep === 2 && <Step2Form />}
          {currentStep === 3 && <Step3Form />}
          {currentStep === 4 && <Step4Form />}
          {currentStep === 5 && <Step5Form />}
          {currentStep === 6 && <Step6Form />}
          {currentStep === 7 && <Step7Form />}
          {currentStep === 8 && <Step8Form />}
        </CardContent>
      </Card>
    </div>
  );
}