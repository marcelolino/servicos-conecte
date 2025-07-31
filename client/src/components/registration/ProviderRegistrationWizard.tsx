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
import { Progress } from '@/components/ui/progress';
import { RegistrationImageUpload } from '@/components/registration/RegistrationImageUpload';
import { LocationRequestModal } from '@/components/location/LocationRequestModal';
import { User, Phone, Mail, CreditCard, Briefcase, Camera, Building2, MapPin } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { extractAddressComponents } from '@/lib/addressUtils';

// Schemas para cada passo
const step1Schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 caracteres'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ deve ter pelo menos 11 caracteres'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const step2Schema = z.object({
  categoryId: z.number().min(1, 'Selecione uma categoria'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  experience: z.string().min(10, 'Experiência deve ter pelo menos 10 caracteres'),
  basePrice: z.string().min(1, 'Informe um preço base'),
});

const step3Schema = z.object({
  bankName: z.string().min(2, 'Informe o nome do banco'),
  bankAgency: z.string().min(3, 'Informe a agência'),
  bankAccount: z.string().min(4, 'Informe a conta'),
  avatar: z.string().optional(),
  documentPhoto: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

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
      title: 'Dados Pessoais',
      description: 'Nome, email, telefone e documentos',
      icon: User,
    },
    {
      title: 'Categoria e Serviços',
      description: 'Especialidade e experiência profissional',
      icon: Briefcase,
    },
    {
      title: 'Dados Bancários e Foto',
      description: 'Informações para pagamento e perfil',
      icon: Building2,
    },
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

  const Step1Form = () => {
    const form = useForm<Step1Data>({
      resolver: zodResolver(step1Schema),
      defaultValues: {
        name: registrationData.name || '',
        email: registrationData.email || '',
        phone: registrationData.phone || '',
        cpfCnpj: registrationData.cpfCnpj || '',
        password: registrationData.password || '',
      },
    });

    const onSubmit = (data: Step1Data) => {
      saveDraft(data);
      setCurrentStep(2);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Seu nome completo" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <Input placeholder="(11) 99999-9999" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpfCnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF/CNPJ</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="000.000.000-00" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Sua senha" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between">
            <div />
            <Button type="submit">Próximo Passo</Button>
          </div>
        </form>
      </Form>
    );
  };

  const Step2Form = () => {
    const form = useForm<Step2Data>({
      resolver: zodResolver(step2Schema),
      defaultValues: {
        categoryId: registrationData.categoryId || 0,
        description: registrationData.description || '',
        experience: registrationData.experience || '',
        basePrice: registrationData.basePrice || '',
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
        bankName: registrationData.bankName || '',
        bankAgency: registrationData.bankAgency || '',
        bankAccount: registrationData.bankAccount || '',
        avatar: registrationData.avatar || '',
        documentPhoto: registrationData.documentPhoto || '',
      },
    });

    const onSubmit = (data: Step3Data) => {
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

        <LocationRequestModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onLocationSet={handleLocationSet}
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
        
        <Progress value={(currentStep / 3) * 100} className="mb-4" />
        
        <div className="grid grid-cols-3 gap-4">
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
        </CardContent>
      </Card>
    </div>
  );
}