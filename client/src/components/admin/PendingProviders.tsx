import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Eye, Phone, Mail, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';

interface PendingProvider {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    city: string;
    state: string;
  };
  cpfCnpj: string;
  description: string;
  experience: string;
  bankName: string;
  bankAgency: string;
  bankAccount: string;
  avatar: string;
  createdAt: string;
}

export function PendingProviders() {
  const [selectedProvider, setSelectedProvider] = useState<PendingProvider | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingProviders = [], isLoading } = useQuery<PendingProvider[]>({
    queryKey: ['/api/admin/providers/pending'],
  });

  const approveProviderMutation = useMutation({
    mutationFn: async (providerId: number) => {
      const response = await apiRequest(`/api/admin/providers/${providerId}/approve`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Erro ao aprovar prestador');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Prestador aprovado',
        description: 'O prestador foi aprovado com sucesso!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/providers/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/metrics'] });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar o prestador.',
        variant: 'destructive',
      });
    },
  });

  const rejectProviderMutation = useMutation({
    mutationFn: async (providerId: number) => {
      const response = await apiRequest(`/api/admin/providers/${providerId}/reject`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Erro ao rejeitar prestador');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Prestador rejeitado',
        description: 'O prestador foi rejeitado.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/providers/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/metrics'] });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar o prestador.',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prestadores Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Prestadores Pendentes
          <Badge variant="secondary">{pendingProviders.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingProviders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum prestador aguardando aprovação
          </div>
        ) : (
          <div className="space-y-4">
            {pendingProviders.map((provider) => (
              <div
                key={provider.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={provider.avatar} />
                      <AvatarFallback>
                        {provider.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{provider.user.name}</h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {provider.user.email}
                        </div>
                        
                        {provider.user.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {provider.user.phone}
                          </div>
                        )}
                        
                        {provider.user.city && provider.user.state && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {provider.user.city} - {provider.user.state}
                          </div>
                        )}
                      </div>
                      
                      {provider.description && (
                        <p className="text-sm text-gray-700 mt-2 max-w-md">
                          {provider.description}
                        </p>
                      )}
                      
                      {provider.experience && (
                        <p className="text-sm text-blue-600 mt-1">
                          Experiência: {provider.experience}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => approveProviderMutation.mutate(provider.id)}
                      disabled={approveProviderMutation.isPending}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rejectProviderMutation.mutate(provider.id)}
                      disabled={rejectProviderMutation.isPending}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
                
                {provider.bankName && (
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    <div className="flex gap-4">
                      <span>Banco: {provider.bankName}</span>
                      <span>Agência: {provider.bankAgency}</span>
                      <span>Conta: {provider.bankAccount}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}