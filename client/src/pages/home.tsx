import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ServiceCard from "@/components/service-card";
import ProviderCard from "@/components/provider-card";
import { Search, CheckCircle, Handshake, Star } from "lucide-react";
import { Link } from "wouter";
import type { ServiceCategory } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cep, setCep] = useState("");

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ["/api/providers/category", selectedCategory],
    enabled: !!selectedCategory,
  });

  const handleServiceSearch = () => {
    if (!selectedCategory || !cep) {
      alert("Por favor, selecione um serviço e informe seu CEP");
      return;
    }
    
    // TODO: Implement service search with geolocation
    console.log("Searching for category:", selectedCategory, "CEP:", cep);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="hero-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Conectamos você aos melhores prestadores de serviços
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Encontre profissionais qualificados para suas necessidades domésticas e comerciais
            </p>
            
            {/* Service Search */}
            <Card className="max-w-2xl mx-auto shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="service-select" className="block text-sm font-medium text-muted-foreground mb-2">
                      Que serviço você precisa?
                    </Label>
                    <Select onValueChange={(value) => setSelectedCategory(parseInt(value))}>
                      <SelectTrigger id="service-select">
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesLoading ? (
                          <div className="p-2">
                            <Skeleton className="h-4 w-full" />
                          </div>
                        ) : (
                          categories?.map((category: ServiceCategory) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="cep-input" className="block text-sm font-medium text-muted-foreground mb-2">
                      Seu CEP
                    </Label>
                    <Input
                      id="cep-input"
                      type="text"
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button onClick={handleServiceSearch} className="md:mt-7">
                    <Search className="h-4 w-4 mr-2" />
                    Buscar Profissionais
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Categories */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">Categorias de Serviços</h3>
            <p className="text-muted-foreground text-lg">Encontre o profissional ideal para cada necessidade</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {categoriesLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="p-6">
                  <CardContent className="p-0 text-center">
                    <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-4 w-20 mx-auto mb-2" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </CardContent>
                </Card>
              ))
            ) : (
              categories?.map((category: ServiceCategory) => (
                <ServiceCard
                  key={category.id}
                  category={category}
                  onClick={() => setSelectedCategory(category.id)}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">Como Funciona</h3>
            <p className="text-muted-foreground text-lg">Simples, rápido e seguro</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-4">1. Encontre</h4>
              <p className="text-muted-foreground">
                Busque pelo serviço que precisa e veja profissionais disponíveis na sua região
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-secondary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Handshake className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-4">2. Contrate</h4>
              <p className="text-muted-foreground">
                Solicite orçamento, compare preços e escolha o melhor profissional para você
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-4">3. Avalie</h4>
              <p className="text-muted-foreground">
                Após o serviço, avalie o profissional e ajude outros clientes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Profiles Preview */}
      {selectedCategory && (
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-foreground mb-4">Profissionais Qualificados</h3>
              <p className="text-muted-foreground text-lg">Conheça alguns dos nossos prestadores de serviços</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providersLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="p-6">
                    <CardContent className="p-0">
                      <div className="flex items-start space-x-4">
                        <Skeleton className="w-16 h-16 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-24 mb-2" />
                          <Skeleton className="h-3 w-full mb-4" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                providers?.map((provider: any) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    onRequestQuote={() => {
                      // TODO: Implement quote request
                      console.log("Request quote for provider:", provider.id);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Provider CTA */}
      <section className="py-20 provider-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">Seja um Prestador de Serviços</h3>
          <p className="text-xl mb-8 text-green-100">Aumente sua renda conectando-se com novos clientes</p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Mais Clientes</h4>
              <p className="text-green-100">Acesse milhares de clientes procurando por seus serviços</p>
            </div>
            
            <div className="text-center">
              <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Flexibilidade</h4>
              <p className="text-green-100">Trabalhe nos seus horários e defina seu raio de atendimento</p>
            </div>
            
            <div className="text-center">
              <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Pagamento Seguro</h4>
              <p className="text-green-100">Receba seus pagamentos de forma rápida e segura</p>
            </div>
          </div>
          
          <Card className="bg-white bg-opacity-10 max-w-md mx-auto mb-8">
            <CardContent className="p-6">
              <h4 className="text-2xl font-bold mb-4">7 Dias Grátis</h4>
              <p className="text-green-100 mb-4">Teste nossa plataforma sem compromisso</p>
              <p className="text-sm text-green-200">Sem taxas de adesão • Cancele quando quiser</p>
            </CardContent>
          </Card>
          
          <Button asChild size="lg" className="bg-white text-secondary hover:bg-gray-100">
            <Link href="/register?type=provider">
              Quero ser um Prestador
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
