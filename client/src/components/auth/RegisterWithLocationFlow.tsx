import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, ChevronLeft, Edit3, Check } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { OpenStreetMapLocationPicker } from "@/components/location/OpenStreetMapLocationPicker";

interface RegisterWithLocationFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (userData: any) => void;
  detectedLocation?: { lat: number; lng: number; address: string } | null;
}

const step1Schema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
});

const step2Schema = z.object({
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  zipCode: z.string().min(8, "CEP deve ter 8 dígitos"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

export function RegisterWithLocationFlow({ 
  isOpen, 
  onClose, 
  onComplete, 
  detectedLocation 
}: RegisterWithLocationFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(detectedLocation || null);
  const { setSelectedCity } = useLocation();

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      address: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  useEffect(() => {
    if (detectedLocation) {
      setSelectedLocation(detectedLocation);
      // Parse address to fill form fields
      parseAddressToForm(detectedLocation.address);
    }
  }, [detectedLocation]);

  const parseAddressToForm = (address: string) => {
    // Simple address parsing - in production, use a proper geocoding service
    const parts = address.split(',').map(part => part.trim());
    
    if (parts.length >= 4) {
      step2Form.setValue('address', parts[0] || '');
      step2Form.setValue('neighborhood', parts[1] || '');
      step2Form.setValue('city', parts[2] || '');
      
      // Extract state and ZIP from the last parts
      const stateZipPart = parts[parts.length - 1];
      const stateMatch = stateZipPart.match(/([A-Z]{2})/);
      const zipMatch = stateZipPart.match(/(\d{5}-?\d{3})/);
      
      if (stateMatch) step2Form.setValue('state', stateMatch[1]);
      if (zipMatch) step2Form.setValue('zipCode', zipMatch[1].replace('-', ''));
    }
  };

  const handleStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: Step2Data) => {
    if (!step1Data) return;
    
    const completeData = {
      ...step1Data,
      ...data,
      location: selectedLocation,
    };
    
    // Update city context
    setSelectedCity({ city: data.city, state: data.state });
    
    onComplete(completeData);
    onClose();
  };

  const handleLocationUpdate = (location: { lat: number; lng: number; address: string }) => {
    setSelectedLocation(location);
    parseAddressToForm(location.address);
    setShowLocationPicker(false);
  };

  const getLocationDisplayText = () => {
    if (!selectedLocation) return "Nenhuma localização detectada";
    
    const addressParts = selectedLocation.address.split(',');
    return addressParts.slice(0, 3).join(',').trim() || selectedLocation.address;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentStep === 2 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setCurrentStep(1)}
                  className="p-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              Cadastro - Passo {currentStep} de 2
            </DialogTitle>
          </DialogHeader>

          {currentStep === 1 && (
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
                <FormField
                  control={step1Form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(00) 00000-0000" 
                          {...field}
                          onChange={(e) => {
                            // Simple phone mask
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 11) {
                              value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                            } else if (value.length >= 7) {
                              value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                            } else if (value.length >= 3) {
                              value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
                            }
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit">
                    Próximo
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Location Display */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Localização Detectada
                  </span>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  {getLocationDisplayText()}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLocationPicker(true)}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Ajustar localização
                </Button>
              </div>

              <Form {...step2Form}>
                <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
                  <FormField
                    control={step2Form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, número" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={step2Form.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input placeholder="Bairro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={step2Form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="00000-000" 
                              {...field}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, '');
                                if (value.length >= 5) {
                                  value = value.replace(/(\d{5})(\d{0,3})/, '$1-$2');
                                }
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={step2Form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={step2Form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="UF" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value.toUpperCase().slice(0, 2));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCurrentStep(1)}
                    >
                      Voltar
                    </Button>
                    <Button type="submit">
                      <Check className="h-4 w-4 mr-2" />
                      Finalizar Cadastro
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <Dialog open={showLocationPicker} onOpenChange={setShowLocationPicker}>
          <DialogContent className="sm:max-w-[600px] h-[500px]">
            <DialogHeader>
              <DialogTitle>Ajustar Localização</DialogTitle>
            </DialogHeader>
            <OpenStreetMapLocationPicker
              isOpen={true}
              onLocationSelect={handleLocationUpdate}
              onClose={() => setShowLocationPicker(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}