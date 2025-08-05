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
import { StepImageUpload } from '@/components/registration/StepImageUpload';
import { OpenStreetMapLocationPicker } from '@/components/location/OpenStreetMapLocationPicker';
import { User, Phone, Mail, CreditCard, Briefcase, Camera, Building2, MapPin, FileText, Upload, Shield, Banknote, Clock, Check } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { extractAddressComponents } from '@/lib/addressUtils';
import { validateCpfCnpj, formatCpfCnpj } from '@/utils/cpf-validator';
import { validatePhone, formatPhone } from '@/utils/phone-validator';

// Schemas for each step
const step1Schema = z.object({
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório').refine(validatePhone, 'Número de telefone inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  categoryId: z.number().min(1, 'Selecione uma categoria'),
  workingHours: z.string().min(5, 'Informe o horário de funcionamento'),
});

const step3Schema = z.object({
  fullName: z.string().min(2, 'Nome completo é obrigatório'),
  cpf: z.string().min(1, 'CPF é obrigatório').refine(validateCpfCnpj, 'CPF inválido'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
});

const step4Schema = z.object({
  documentPhoto: z.string().min(1, 'Foto do documento é obrigatória'),
  cnpj: z.string().optional(),
  addressProof: z.string().optional(),
});

const step5Schema = z.object({
  acceptedTerms: z.boolean().refine(val => val === true, 'Você deve aceitar os termos'),
});

const step6Schema = z.object({
  avatar: z.string().optional(),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  portfolioImages: z.array(z.string()).optional(),
});

const step7Schema = z.object({
  acknowledged: z.boolean().refine(val => val === true, 'Confirme que entendeu o processo'),
});

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

interface ProviderRegistration8StepsProps {
  onComplete: (data: any) => void;
}

export function ProviderRegistration8Steps({ onComplete }: ProviderRegistration8StepsProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationData, setRegistrationData] = useState<any>({});
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const { selectedCity, setSelectedCity } = useLocation();
  
  // Initialize with default location if none selected
  useEffect(() => {
    if (!selectedCity || !selectedCity.city) {
      setSelectedCity({ city: 'São Paulo', state: 'SP' });
    }
  }, [selectedCity, setSelectedCity]);
  const { toast } = useToast();

  // Load categories
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

  // Save draft automatically
  const saveDraft = (data: any) => {
    const draftData = { ...registrationData, ...data, currentStep };
    setRegistrationData(draftData);
    localStorage.setItem('providerRegistrationDraft', JSON.stringify(draftData));
  };

  // Handle location selection
  const handleLocationSet = (location: { lat: number; lng: number; address: string }) => {
    const addressComponents = extractAddressComponents(location.address);
    const cityState = {
      city: addressComponents.city || 'Cidade não identificada',
      state: addressComponents.state || 'Estado não identificado'
    };
    
    setSelectedCity(cityState);
    setIsLocationModalOpen(false);
    
    // Update location in draft data
    const updatedData = { ...registrationData, city: cityState.city, state: cityState.state };
    setRegistrationData(updatedData);
    localStorage.setItem('providerRegistrationDraft', JSON.stringify(updatedData));
    
    toast({
      title: 'Localização selecionada',
      description: `${cityState.city} - ${cityState.state}`,
    });
  };

  // Step 1: Create Account
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

          <div className="flex justify-end">
            <Button type="submit">Próximo Passo</Button>
          </div>
        </form>
      </Form>
    );
  };

  // Step 2: Provider Information
  const Step2Form = () => {
    const [formData, setFormData] = useState({
      name: registrationData.name || '',
      categoryId: registrationData.categoryId || 0,
      workingHours: registrationData.workingHours || '',
    });

    const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Simple validation
      if (!formData.name || formData.name.trim().length === 0) {
        setFormErrors({ name: 'Nome do prestador é obrigatório' });
        return;
      }
      
      if (!formData.categoryId || formData.categoryId === 0) {
        setFormErrors({ categoryId: 'Categoria de serviço é obrigatória' });
        return;
      }
      
      setFormErrors({});
      saveDraft(formData);
      setCurrentStep(3);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold mb-2">Informações do Prestador</h2>
          <p className="text-gray-600">Nome do prestador e categoria de serviço</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Nome do Prestador (ou nome fantasia) *</label>
          <Input 
            placeholder="Ex: João Silva - Eletricista" 
            value={formData.name}
            onChange={(e) => {
              const value = e.target.value;
              setFormData(prev => ({ ...prev, name: value }));
            }}
            onBlur={(e) => {
              // Save to registration data only on blur to avoid re-renders
              setRegistrationData(prev => ({ ...prev, name: e.target.value }));
            }}
          />
          {formErrors.name && (
            <p className="text-red-500 text-sm">{formErrors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Categoria de Serviço *</label>
          <Select 
            value={formData.categoryId?.toString() || ""} 
            onValueChange={(value) => {
              const numValue = parseInt(value);
              setFormData(prev => ({ ...prev, categoryId: numValue }));
              setRegistrationData(prev => ({ ...prev, categoryId: numValue }));
              setFormErrors(prev => ({ ...prev, categoryId: '' })); // Clear error on selection
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ex: encanador, eletricista, diarista" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.categoryId && (
            <p className="text-red-500 text-sm">{formErrors.categoryId}</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Área de Atendimento</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              Cidade atual: {selectedCity?.city || 'Não selecionada'} - {selectedCity?.state || ''}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsLocationModalOpen(true)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Selecionar Endereço via Mapa
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Horário de Funcionamento</label>
          <Input 
            placeholder="Ex: Segunda a Sexta: 8h às 18h / Sábados: 8h às 12h" 
            value={formData.workingHours}
            onChange={(e) => {
              const value = e.target.value;
              setFormData(prev => ({ ...prev, workingHours: value }));
            }}
            onBlur={(e) => {
              setRegistrationData(prev => ({ ...prev, workingHours: e.target.value }));
            }}
          />
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
            Voltar
          </Button>
          <Button type="submit">Próximo Passo</Button>
        </div>
      </form>
    );
  };

  // Step 3: Legal Responsible Data
  const Step3Form = () => {
    const form = useForm<Step3Data>({
      resolver: zodResolver(step3Schema),
      defaultValues: {
        fullName: registrationData.fullName || '',
        cpf: registrationData.cpf || '',
        birthDate: registrationData.birthDate || '',
      },
    });

    const onSubmit = (data: Step3Data) => {
      saveDraft(data);
      setCurrentStep(4);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold mb-2">Dados do Responsável Legal</h2>
            <p className="text-gray-600">Informações pessoais do responsável</p>
          </div>

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo do responsável" {...field} />
                </FormControl>
                <FormMessage />
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
                      const formatted = formatCpfCnpj(e.target.value);
                      field.onChange(formatted);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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

  // Step 4: Documentation
  const Step4Form = () => {
    const [formData, setFormData] = useState<Step4Data>({
      documentPhoto: registrationData.documentPhoto || '',
      cnpj: registrationData.cnpj || '',
      addressProof: registrationData.addressProof || '',
    });

    const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Form data state:', formData);
      console.log('Registration data state:', registrationData);
      
      // Use registration data as fallback if form data is empty
      const documentPhoto = formData.documentPhoto || registrationData.documentPhoto || '';
      const cnpj = formData.cnpj || registrationData.cnpj || '';
      const addressProof = formData.addressProof || registrationData.addressProof || '';
      
      const submitData = { documentPhoto, cnpj, addressProof };
      console.log('Combined submit data:', submitData);
      
      // Simple validation
      if (!documentPhoto || documentPhoto.trim().length === 0) {
        setFormErrors({ documentPhoto: 'Foto do documento é obrigatória' });
        console.error('Document photo is required but missing');
        return;
      }
      
      setFormErrors({});
      console.log('Submitting combined data:', submitData);
      saveDraft(submitData);
      setCurrentStep(5);
    };

    const handleDocumentUpload = (url: string) => {
      console.log('Document uploaded:', url);
      const newFormData = { ...formData, documentPhoto: url };
      setFormData(newFormData);
      setFormErrors(prev => ({ ...prev, documentPhoto: '' })); // Clear error
      
      // Also save to registration data immediately to persist across re-renders
      setRegistrationData(prev => ({ ...prev, documentPhoto: url }));
      console.log('Form data state after upload:', newFormData);
    };

    const handleAddressProofUpload = (url: string) => {
      const newFormData = { ...formData, addressProof: url };
      setFormData(newFormData);
      setRegistrationData(prev => ({ ...prev, addressProof: url }));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold mb-2">Documentação Necessária</h2>
          <p className="text-gray-600">Upload dos documentos obrigatórios</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Foto do Documento de Identidade (RG ou CNH) *</label>
          <StepImageUpload
            onUpload={handleDocumentUpload}
            category="documents"
            className="border-2 border-dashed border-gray-300 rounded-lg p-8"
            currentImage={formData.documentPhoto}
          />
          {formErrors.documentPhoto && (
            <p className="text-red-500 text-sm">{formErrors.documentPhoto}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">CNPJ (opcional - caso atue como empresa)</label>
          <Input 
            placeholder="00.000.000/0000-00" 
            value={formData.cnpj}
            onChange={(e) => {
              const formatted = formatCpfCnpj(e.target.value);
              setFormData(prev => ({ ...prev, cnpj: formatted }));
              setRegistrationData(prev => ({ ...prev, cnpj: formatted }));
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Comprovante de Endereço (opcional)</label>
          <StepImageUpload
            onUpload={handleAddressProofUpload}
            category="documents"
            className="border-2 border-dashed border-gray-300 rounded-lg p-8"
            currentImage={formData.addressProof}
          />
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>
            Voltar
          </Button>
          <Button type="submit">
            Próximo Passo
          </Button>
        </div>
      </form>
    );
  };

  // Step 5: Partnership Plan
  const Step5Form = () => {
    const form = useForm<Step5Data>({
      resolver: zodResolver(step5Schema),
      defaultValues: {
        acceptedTerms: registrationData.acceptedTerms || false,
      },
    });

    const onSubmit = (data: Step5Data) => {
      saveDraft(data);
      setCurrentStep(6);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold mb-2">Escolha do Plano de Parceria</h2>
            <p className="text-gray-600">Plano básico com comissões transparentes</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Plano Básico</h3>
                <p className="text-sm text-green-600">Recomendado para todos os prestadores</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm">Comissão por serviço:</span>
                <span className="font-semibold text-green-700">7%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Taxa pagamentos online (PIX/Cartão):</span>
                <span className="font-semibold text-green-700">3,2%</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total máximo de taxas:</span>
                  <span className="font-bold text-green-800">10,2%</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-green-600 space-y-1">
              <p>• Sem mensalidade ou taxas de adesão</p>
              <p>• Receba em até 1 dia útil via PIX</p>
              <p>• Suporte dedicado para prestadores</p>
              <p>• Ferramentas gratuitas de gestão</p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="acceptedTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Aceito os termos do Plano Básico e as condições de comissão
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(4)}>
              Voltar
            </Button>
            <Button type="submit">Próximo Passo</Button>
          </div>
        </form>
      </Form>
    );
  };

  // Step 6: Profile Customization
  const Step6Form = () => {
    const form = useForm<Step6Data>({
      resolver: zodResolver(step6Schema),
      defaultValues: {
        avatar: registrationData.avatar || '',
        description: registrationData.description || '',
        portfolioImages: registrationData.portfolioImages || [],
      },
    });

    const onSubmit = (data: Step6Data) => {
      const dataWithPortfolio = { ...data, portfolioImages };
      saveDraft(dataWithPortfolio);
      setCurrentStep(7);
    };

    const handleAvatarUpload = (url: string) => {
      form.setValue('avatar', url);
      form.clearErrors('avatar'); // Clear any existing validation errors
    };

    const handlePortfolioUpload = (url: string) => {
      setPortfolioImages(prev => [...prev, url]);
    };

    const removePortfolioImage = (index: number) => {
      setPortfolioImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold mb-2">Personalização do Perfil</h2>
            <p className="text-gray-600">Foto de perfil e galeria de trabalhos</p>
          </div>

          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Foto de Perfil, Logo ou Foto da Fachada/Equipamento</FormLabel>
                <FormControl>
                  <StepImageUpload
                    onUpload={handleAvatarUpload}
                    category="avatars"
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8"
                    currentImage={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Breve Descrição dos Serviços Oferecidos</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva os serviços que você oferece, sua experiência e diferenciais..."
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormLabel>Galeria de Imagens de Trabalhos Realizados (opcional)</FormLabel>
            <StepImageUpload
              onUpload={handlePortfolioUpload}
              category="portfolio"
              className="border-2 border-dashed border-gray-300 rounded-lg p-8"
            />
            
            {portfolioImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {portfolioImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={image} 
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removePortfolioImage(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(5)}>
              Voltar
            </Button>
            <Button type="submit">Próximo Passo</Button>
          </div>
        </form>
      </Form>
    );
  };

  // Step 7: Approval Process
  const Step7Form = () => {
    const form = useForm<Step7Data>({
      resolver: zodResolver(step7Schema),
      defaultValues: {
        acknowledged: registrationData.acknowledged || false,
      },
    });

    const onSubmit = (data: Step7Data) => {
      saveDraft(data);
      setCurrentStep(8);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold mb-2">Aprovação e Ativação</h2>
            <p className="text-gray-600">Processo de revisão administrativa</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-800">Processo de Aprovação</h3>
                <p className="text-sm text-blue-600">Garantimos a qualidade dos prestadores</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-blue-700">
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 bg-blue-400 rounded-full mt-2"></div>
                <p>O administrador do app irá revisar todos os seus dados e documentos</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 bg-blue-400 rounded-full mt-2"></div>
                <p>Verificaremos a autenticidade dos documentos enviados</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 bg-blue-400 rounded-full mt-2"></div>
                <p>Após aprovação, seu perfil ficará ativo e visível para clientes</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 bg-blue-400 rounded-full mt-2"></div>
                <p>Você receberá uma notificação por email quando for aprovado</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-100 rounded text-sm text-blue-800">
              <strong>Tempo estimado:</strong> 1-3 dias úteis para análise completa
            </div>
          </div>

          <FormField
            control={form.control}
            name="acknowledged"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Entendo que preciso aguardar a aprovação do administrador para começar a receber pedidos
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(6)}>
              Voltar
            </Button>
            <Button type="submit">Próximo Passo</Button>
          </div>
        </form>
      </Form>
    );
  };

  // Step 8: Payment Configuration
  const Step8Form = () => {
    const form = useForm<Step8Data>({
      resolver: zodResolver(step8Schema),
      defaultValues: {
        acknowledged: registrationData.acknowledged || false,
      },
    });

    const onSubmit = (data: Step8Data) => {
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
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold mb-2">Configuração de Pagamentos</h2>
            <p className="text-gray-600">Configure suas contas para receber os pagamentos</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Banknote className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Métodos de Pagamento</h3>
                <p className="text-sm text-green-600">Configure após a aprovação do seu cadastro</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-green-700">
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 bg-green-400 rounded-full mt-2"></div>
                <p>Acesse o menu "Métodos de Pagamento" no seu painel</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 bg-green-400 rounded-full mt-2"></div>
                <p>Configure suas Contas Bancárias para receber transferências</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 bg-green-400 rounded-full mt-2"></div>
                <p>Adicione suas Chaves PIX para recebimentos instantâneos</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 bg-green-400 rounded-full mt-2"></div>
                <p>Você pode configurar múltiplas contas e escolher a principal</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-100 rounded text-sm text-green-800">
              <strong>Importante:</strong> Configure seus métodos de pagamento logo após a aprovação para não perder pedidos
            </div>
          </div>

          <FormField
            control={form.control}
            name="acknowledged"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Entendo que preciso configurar os métodos de pagamento no menu "Métodos de Pagamento" após a aprovação
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(7)}>
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

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return <Step1Form />;
      case 2: return <Step2Form />;
      case 3: return <Step3Form />;
      case 4: return <Step4Form />;
      case 5: return <Step5Form />;
      case 6: return <Step6Form />;
      case 7: return <Step7Form />;
      case 8: return <Step8Form />;
      default: return <Step1Form />;
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Cadastro de Prestador</h1>
            <span className="text-sm text-gray-500">
              Cidade: {selectedCity?.city || 'Não selecionada'} - {selectedCity?.state || ''}
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
                  className={`flex flex-col items-center gap-2 p-2 rounded-lg border text-center ${
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
                    <p className="font-medium text-xs">{step.title}</p>
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
            <CardTitle>
              Passo {currentStep} de 8: {steps[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderCurrentStep()}
          </CardContent>
        </Card>
      </div>

      <OpenStreetMapLocationPicker
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSelect={handleLocationSet}
      />
    </>
  );
}