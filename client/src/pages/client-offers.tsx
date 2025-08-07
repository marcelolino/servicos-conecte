import { ModernClientLayout } from "@/components/layout/modern-client-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Calendar, DollarSign, Star, MapPin } from "lucide-react";

export default function ClientOffers() {
  const offers = [
    {
      id: 1,
      title: "20% Off - Serviços de Encanamento",
      description: "Desconto especial em todos os serviços de reparo hidráulico durante este mês",
      discount: "20%",
      validUntil: "2025-01-31",
      category: "Encanamento",
      minValue: 100,
      maxDiscount: 50
    },
    {
      id: 2,
      title: "15% Off - Limpeza Residencial",
      description: "Oferta especial para novos clientes em serviços de limpeza completa",
      discount: "15%",
      validUntil: "2025-02-15",
      category: "Limpeza",
      minValue: 150,
      maxDiscount: 75
    },
    {
      id: 3,
      title: "Primeira Consulta Grátis",
      description: "Consultoria gratuita para serviços de jardinagem e paisagismo",
      discount: "100%",
      validUntil: "2025-01-25",
      category: "Jardinagem",
      minValue: 0,
      maxDiscount: 80
    }
  ];

  return (
    <ModernClientLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Ofertas Especiais
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Aproveite descontos exclusivos em serviços selecionados
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="border border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-orange-500 text-white hover:bg-orange-600">
                    <Gift className="h-3 w-3 mr-1" />
                    {offer.discount} OFF
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {offer.category}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  {offer.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {offer.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Válido até: {new Date(offer.validUntil).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  {offer.minValue > 0 && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>Valor mínimo: R$ {offer.minValue}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Star className="h-4 w-4 mr-2" />
                    <span>Desconto máximo: R$ {offer.maxDiscount}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-orange-200">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    Usar Oferta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {offers.length === 0 && (
          <Card className="p-12 text-center">
            <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma oferta disponível
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Fique atento! Novas ofertas especiais serão disponibilizadas em breve.
            </p>
          </Card>
        )}
      </div>
    </ModernClientLayout>
  );
}