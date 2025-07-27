import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RatingModalProps {
  serviceRequestId: number;
  providerId: number;
  providerName: string;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export default function RatingModal({ 
  serviceRequestId, 
  providerId, 
  providerName, 
  trigger,
  onSuccess 
}: RatingModalProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if review already exists
  const { data: existingReview } = useQuery({
    queryKey: ['/api/reviews/service-request', serviceRequestId],
    enabled: open,
  });

  const submitReviewMutation = useMutation({
    mutationFn: (data: { serviceRequestId: number; providerId: number; rating: number; comment: string }) =>
      apiRequest("POST", "/api/reviews", data),
    onSuccess: () => {
      toast({
        title: "Avaliação enviada!",
        description: "Sua avaliação foi registrada com sucesso.",
      });
      
      // Reset form
      setRating(0);
      setComment("");
      setOpen(false);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests/client'] });
      queryClient.invalidateQueries({ queryKey: ['/api/providers', providerId, 'reviews'] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar avaliação",
        description: error.message || "Houve um erro ao enviar sua avaliação.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Avaliação obrigatória",
        description: "Por favor, selecione uma avaliação de 1 a 5 estrelas.",
        variant: "destructive",
      });
      return;
    }

    submitReviewMutation.mutate({
      serviceRequestId,
      providerId,
      rating,
      comment: comment.trim(),
    });
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className="focus:outline-none transition-colors"
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
          onClick={() => setRating(i)}
        >
          <Star
            className={`h-8 w-8 ${
              i <= (hoveredRating || rating)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            } transition-colors hover:text-yellow-400`}
          />
        </button>
      );
    }
    return stars;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar Prestador</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {existingReview ? (
            // Show existing review
            <div className="text-center space-y-4">
              <h3 className="text-lg font-medium">Sua Avaliação</h3>
              <p className="text-sm text-muted-foreground">
                Você já avaliou este serviço de {providerName}
              </p>
              
              <div className="space-y-2">
                <Label>Avaliação</Label>
                <div className="flex justify-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${
                        i < existingReview.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {existingReview.rating === 1 && "Muito ruim"}
                  {existingReview.rating === 2 && "Ruim"}
                  {existingReview.rating === 3 && "Regular"}
                  {existingReview.rating === 4 && "Bom"}
                  {existingReview.rating === 5 && "Excelente"}
                </p>
              </div>

              {existingReview.comment && (
                <div className="space-y-2">
                  <Label>Seu Comentário</Label>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    {existingReview.comment}
                  </div>
                </div>
              )}

              <Button onClick={() => setOpen(false)} className="w-full">
                Fechar
              </Button>
            </div>
          ) : (
            // Show rating form
            <>
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Como foi o serviço do {providerName}?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sua avaliação ajuda outros clientes a escolherem o melhor prestador
                </p>
              </div>

              <div className="space-y-2">
                <Label>Avaliação *</Label>
                <div className="flex justify-center gap-1">
                  {renderStars()}
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    {rating === 1 && "Muito ruim"}
                    {rating === 2 && "Ruim"}
                    {rating === 3 && "Regular"}
                    {rating === 4 && "Bom"}
                    {rating === 5 && "Excelente"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Comentário (opcional)</Label>
                <Textarea
                  id="comment"
                  placeholder="Conte como foi sua experiência com este prestador..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {comment.length}/500 caracteres
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setOpen(false)}
                  disabled={submitReviewMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleSubmit}
                  disabled={submitReviewMutation.isPending || rating === 0}
                >
                  {submitReviewMutation.isPending ? "Enviando..." : "Enviar Avaliação"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}