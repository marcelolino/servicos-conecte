import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ModernProviderLayout } from "@/components/layout/modern-provider-layout";
import { Search, Calendar, Eye, Trash2 } from "lucide-react";

export default function ProviderPromotionalBanners() {
  const { user, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("Nenhuma ação");
  const [selectedBanners, setSelectedBanners] = useState<string[]>([]);

  // Mock data for promotional banners
  const promotionalBanners = [
    {
      id: "#4",
      image: "/api/placeholder/80/60",
      schedule: "19 de julho de 2025 - 18 de agosto de 2025",
      price: "$100.00",
      status: "Aceitado",
      actions: true
    },
    {
      id: "#3",
      image: "/api/placeholder/80/60",
      schedule: "19 de julho de 2025 - 18 de agosto de 2025",
      price: "$100.00",
      status: "Aceitado",
      actions: true
    },
    {
      id: "#2",
      image: "/api/placeholder/80/60",
      schedule: "19 de julho de 2025 - 18 de agosto de 2025",
      price: "$100.00",
      status: "Aceitado",
      actions: true
    }
  ];

  const filteredBanners = promotionalBanners.filter(banner => {
    const matchesSearch = banner.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         banner.schedule.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSelectBanner = (bannerId: string) => {
    setSelectedBanners(prev => 
      prev.includes(bannerId) 
        ? prev.filter(id => id !== bannerId)
        : [...prev, bannerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBanners.length === filteredBanners.length) {
      setSelectedBanners([]);
    } else {
      setSelectedBanners(filteredBanners.map(banner => banner.id));
    }
  };

  if (isLoading) {
    return (
      <ModernProviderLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </ModernProviderLayout>
    );
  }

  return (
    <ModernProviderLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Banner Promocional do Provedor</h1>
          <Button className="bg-primary text-primary-foreground">
            ⊕ Adicionar novo
          </Button>
        </div>

        {/* Actions and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-4">
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nenhuma ação">Nenhuma ação</SelectItem>
                <SelectItem value="Deletar">Deletar</SelectItem>
                <SelectItem value="Ativar">Ativar</SelectItem>
                <SelectItem value="Desativar">Desativar</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="default">Aplicar</Button>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm text-muted-foreground">Todo</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Procurar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        {/* Promotional Banners Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="text-primary-foreground font-medium w-12">
                      <Checkbox
                        checked={selectedBanners.length === filteredBanners.length && filteredBanners.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="border-primary-foreground data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary"
                      />
                    </TableHead>
                    <TableHead className="text-primary-foreground font-medium">ID</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Calendário</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Intervalo de datas</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Preço</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Estado</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Razão</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanners.length > 0 ? (
                    filteredBanners.map((banner) => (
                      <TableRow key={banner.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedBanners.includes(banner.id)}
                            onCheckedChange={() => handleSelectBanner(banner.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{banner.id}</TableCell>
                        <TableCell>
                          <div className="w-16 h-12 bg-muted rounded border overflow-hidden">
                            <img 
                              src={banner.image} 
                              alt="Banner" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>{banner.schedule}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {banner.price}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {banner.status}
                          </Badge>
                        </TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="p-1 h-8 w-8 text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum banner encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            © 2024 Todos os direitos reservados por IQONIC Design
          </div>
        </div>
      </div>
    </ModernProviderLayout>
  );
}