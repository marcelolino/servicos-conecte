import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RegistrationImageUpload } from './RegistrationImageUpload';
import { ChevronRight, ChevronLeft, Upload, Wrench, Eye, EyeOff, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateCPF, formatCPF, getCPFErrorMessage, generateValidCPF } from '@/utils/cpf-validator';

// Schemas para cada passo
const step1Schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  cpf: z.string()
    .min(1, 'CPF é obrigatório')
    .refine((value) => validateCPF(value), {
      message: 'CPF inválido',
    }),
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  state: z.string().min(2, 'Estado deve ter pelo menos 2 caracteres'),
  cep: z.string()
    .min(8, 'CEP deve ter 8 dígitos')
    .max(9, 'CEP deve ter 8 dígitos'),
  profilePhoto: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

interface ClientRegistrationWizardProps {
  onComplete: (data: any) => void;
}

export function ClientRegistrationWizard({ onComplete }: ClientRegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationData, setRegistrationData] = useState<any>({});
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cpfValue, setCpfValue] = useState('');
  const [addressValue, setAddressValue] = useState('');
  const [fillTemporaryAddress, setFillTemporaryAddress] = useState(false);
  const { toast } = useToast();

  // Auto-fill temporary address when requested
  useEffect(() => {
    if (fillTemporaryAddress) {
      setAddressValue('Rua Visconde Santos, 00');
      const validCpf = generateValidCPF();
      setCpfValue(validCpf);
      
      // Also update registration data with temporary values
      setRegistrationData(prev => ({
        ...prev,
        address: 'Rua Visconde Santos, 00',
        cpf: validCpf,
        city: 'São Paulo',
        state: 'SP',
        cep: '01310-100'
      }));
      
      setFillTemporaryAddress(false);
      
      toast({
        title: "Dados preenchidos automaticamente",
        description: "Endereço temporário e CPF válido foram inseridos nos campos.",
      });
    }
  }, [fillTemporaryAddress, toast]);

  const Step1Form = () => {
    const form = useForm<Step1Data>({
      resolver: zodResolver(step1Schema),
      defaultValues: {
        name: registrationData.name || '',
        email: registrationData.email || '',
        phone: registrationData.phone || '',
        password: registrationData.password || '',
        confirmPassword: registrationData.confirmPassword || '',
      },
    });

    const onSubmit = (data: Step1Data) => {
      setRegistrationData({ ...registrationData, ...data });
      setCurrentStep(2);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
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
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua senha"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
        cpf: cpfValue || registrationData.cpf || '',
        address: addressValue || registrationData.address || '',
        city: registrationData.city || '',
        state: registrationData.state || '',
        cep: registrationData.cep || '',
        profilePhoto: profilePhoto,
      },
    });

    // Update form values when auto-fill is triggered
    useEffect(() => {
      if (cpfValue) {
        form.setValue('cpf', cpfValue);
      }
      if (addressValue) {
        form.setValue('address', addressValue);
      }
      if (registrationData.city) {
        form.setValue('city', registrationData.city);
      }
      if (registrationData.state) {
        form.setValue('state', registrationData.state);
      }
      if (registrationData.cep) {
        form.setValue('cep', registrationData.cep);
      }
    }, [cpfValue, addressValue, registrationData, form]);

    const onSubmit = (data: Step2Data) => {
      const completeData = { 
        ...registrationData, 
        ...data,
        profilePhoto,
        userType: 'client',
      };
      onComplete(completeData);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <RegistrationImageUpload
                value={profilePhoto}
                onChange={setProfilePhoto}
                folder="avatars"
                acceptedFormats={['.jpg', '.jpeg', '.png']}
                maxSizeMB={5}
                placeholder="Clique ou arraste para enviar sua foto"
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
                  Seus detalhes de contato ficam protegidos e você tem controle total sobre suas informações.
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Pedidos ficam disponíveis automaticamente no seu painel
                </p>
              </div>
            </div>
          </div>

          {/* Auto-fill Button */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Preenchimento Rápido
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Preencher dados temporários para teste
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFillTemporaryAddress(true)}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Preencher
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cpf"
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
              name="cpf"
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
              name="cpf"
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
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="000.000.000-00" 
                      {...field}
                      onChange={(e) => {
                        const formatted = formatCPF(e.target.value);
                        field.onChange(formatted);
                        setCpfValue(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
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
                    <Input 
                      placeholder="Rua Visconde Santos, 00" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setAddressValue(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input placeholder="Selecione o estado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Selecione a cidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="00000-000" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        const formatted = value.length > 5 
                          ? `${value.slice(0, 5)}-${value.slice(5, 8)}` 
                          : value;
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <Wrench className="h-8 w-8 text-primary mr-2" />
                <h1 className="text-2xl font-bold text-foreground">Qserviços</h1>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {currentStep === 1 ? 'Criar Conta' : 'Informações Pessoais'}
              </h2>
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
    </div>
  );
}