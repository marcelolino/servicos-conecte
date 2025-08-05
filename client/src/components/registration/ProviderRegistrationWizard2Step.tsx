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
import ImageUpload from '@/components/image-upload';
import { OpenStreetMapLocationPicker } from '@/components/location/OpenStreetMapLocationPicker';
import { User, Phone, Mail, MapPin, Upload, ChevronRight, ChevronLeft } from 'lucide-react';
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
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  profilePhoto: z.string().optional(),
  documentPhoto: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

interface ProviderRegistrationWizard2StepProps {
  onComplete: (data: any) => void;
}

export function ProviderRegistrationWizard2Step({ onComplete }: ProviderRegistrationWizard2StepProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationData, setRegistrationData] = useState<any>({});
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [documentPhoto, setDocumentPhoto] = useState<string>('');
  const { selectedCity, setSelectedCity } = useLocation();
  const { toast } = useToast();

  // Carregar categorias
  const { data: categories = [] } = useQuery<Array<{id: number, name: string}>>({
    queryKey: ['/api/categories'],
  });

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
      setRegistrationData({ ...registrationData, ...data });
      setCurrentStep(2);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome completo" {...field} />
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
                    <Input placeholder="seu@email.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
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
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
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
                    <Input placeholder="Sua senha" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Continuar
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  const Step2Form = () => {
    const form = useForm<Step2Data>({
      resolver: zodResolver(step2Schema),
      defaultValues: {
        categoryId: registrationData.categoryId || undefined,
        description: registrationData.description || '',
        address: registrationData.address || '',
        profilePhoto: profilePhoto,
        documentPhoto: documentPhoto,
      },
    });

    const onSubmit = (data: Step2Data) => {
      const completeData = { 
        ...registrationData, 
        ...data,
        profilePhoto,
        documentPhoto,
        city: selectedCity?.city,
        state: selectedCity?.state,
      };
      onComplete(completeData);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Upload de Foto do Perfil */}
            <div className="space-y-2">
              <FormLabel>Foto do Perfil</FormLabel>
              <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <div className="text-center mb-4">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Clique ou arraste para enviar
                  </p>
                  <p className="text-xs text-gray-500">
                    Somente imagens até 5MB
                  </p>
                </div>
                <ImageUpload
                  category="provider"
                  onUpload={setProfilePhoto}
                  maxFiles={1}
                  currentImages={profilePhoto ? [profilePhoto] : []}
                />
              </div>
            </div>

            {/* Informações adicionais */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Garantimos suas informações
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Seus detalhes de contato (como nome e número de telefone) ficam ocultos até você aceitar um pedido.
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Pedidos ficam disponíveis automaticamente no seu painel
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input value={registrationData.name || ''} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input value={registrationData.email || ''} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input value={registrationData.phone || ''} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input value={registrationData.cpfCnpj || ''} placeholder="000000000" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua Visconde Santos, 00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input value={selectedCity?.state || ''} placeholder="Selecione o estado" disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input value={selectedCity?.city || ''} placeholder="Selecione o cidade" disabled />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000000" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  // Se não há cidade selecionada, mostrar seleção de localização
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
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {currentStep === 1 ? 'Criar Conta' : 'Informações Pessoais'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {currentStep === 1 
                ? 'Cadastre-se como cliente para buscar serviços' 
                : 'Passo 2 do Perfil'
              }
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && <Step1Form />}
          {currentStep === 2 && <Step2Form />}
        </CardContent>
      </Card>
    </div>
  );
}