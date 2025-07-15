import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin } from "lucide-react";
import type { Provider, User } from "@shared/schema";

interface ProviderCardProps {
  provider: Provider & { user: User };
  onRequestQuote: () => void;
}

export default function ProviderCard({ provider, onRequestQuote }: ProviderCardProps) {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="rating-star" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="rating-star opacity-50" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="rating-star opacity-20" />);
    }
    
    return stars;
  };

  const rating = Number(provider.rating) || 0;
  const basePrice = Number(provider.basePrice) || 0;

  return (
    <Card className="provider-card">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-primary">
              {provider.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-foreground">{provider.user.name}</h4>
              {provider.isTrialActive && (
                <Badge variant="secondary" className="text-xs">
                  Período de teste
                </Badge>
              )}
            </div>
            
            <div className="flex items-center mb-2">
              <div className="rating-stars mr-2">
                {renderStars(rating)}
              </div>
              <span className="text-sm text-muted-foreground">
                {rating.toFixed(1)} ({provider.totalReviews} avaliações)
              </span>
            </div>
            
            {provider.user.city && (
              <div className="flex items-center text-sm text-muted-foreground mb-3">
                <MapPin className="h-4 w-4 mr-1" />
                {provider.user.city}, {provider.user.state}
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {provider.description || "Profissional experiente e qualificado."}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">A partir de </span>
                <span className="font-semibold text-secondary">
                  R$ {basePrice.toFixed(2)}/hora
                </span>
              </div>
              
              <Button onClick={onRequestQuote} className="ml-4">
                Solicitar Orçamento
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
