import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { register as registerUser } from "@/lib/auth";
import { ClientRegistrationWizard } from "@/components/registration/ClientRegistrationWizard";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login: authLogin } = useAuth();

  const registerMutation = useMutation({
    mutationFn: (data: any) => registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      userType: 'client',
      avatar: data.profilePhoto,
      address: data.address,
      city: data.city,
      state: data.state,

    }),
    onSuccess: (data) => {
      authLogin(data.token);
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Bem-vindo ao Qserviços!",
      });
      
      // Redirect to home page after successful registration
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
    },
  });

  const handleRegistrationComplete = (data: any) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted px-4 py-8">
      <div className="w-full max-w-md">
        <ClientRegistrationWizard onComplete={handleRegistrationComplete} />
        
        {/* Link para login fora do card */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
