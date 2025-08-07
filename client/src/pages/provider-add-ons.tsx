import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ModernProviderLayout } from "@/components/layout/modern-provider-layout";
import { Search, User, Edit, Trash2 } from "lucide-react";

export default function ProviderAddOns() {
  const { user, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("Nenhuma ação");
  const [filterAll, setFilterAll] = useState("Todo");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  // Mock data for add-ons
  const addOns = [
    {
      id: "1",
      name: "Acabamento anti-rugas",
      service: "Reparo e retoque de costura",
      provider: {
        name: "Felix Harris",
        email: "demo@provider.com"
      },
      price: "$30.00",
      status: "active",
      enabled: true
    },
    {
      id: "2",
      name: "Costura personalizada",
      service: "Reparo e retoque de costura",
      provider: {
        name: "Felix Harris",
        email: "demo@provider.com"
      },
      price: "$29.00",
      status: "active",
      enabled: true
    },
    {
      id: "3",
      name: "Limpeza e restauração de obras de arte",
      service: "Designer de molduras artísticas",
      provider: {
        name: "Felix Harris",
        email: "demo@provider.com"
      },
      price: "$10.00",
      status: "active",
      enabled: true
    },
    {
      id: "4",
      name: "Quadro pressionado das flores",
      service: "Designer de molduras artísticas",
      provider: {
        name: "Felix Harris",
        email: "demo@provider.com"
      },
      price: "$12.00",
      status: "active",
      enabled: true
    }
  ];

  const filteredAddOns = addOns.filter(addOn => {
    const matchesSearch = addOn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         addOn.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         addOn.provider.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSelectAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAddOns.length === filteredAddOns.length) {
      setSelectedAddOns([]);
    } else {
      setSelectedAddOns(filteredAddOns.map(addOn => addOn.id));
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
          <h1 className="text-2xl font-bold text-foreground">Complementos</h1>
          <Button className="bg-primary text-primary-foreground">
            ⊕ Adicionar complemento
          </Button>
        </div>

        {/* Actions and Filters */}
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
            <Select value={filterAll} onValueChange={setFilterAll}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todo">Todo</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
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

        {/* Add-ons Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="text-primary-foreground font-medium w-12">
                      <Checkbox
                        checked={selectedAddOns.length === filteredAddOns.length && filteredAddOns.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="border-primary-foreground data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary"
                      />
                    </TableHead>
                    <TableHead className="text-primary-foreground font-medium">Nome</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Serviço</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Provedor</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Preço</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Estado</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAddOns.length > 0 ? (
                    filteredAddOns.map((addOn) => (
                      <TableRow key={addOn.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedAddOns.includes(addOn.id)}
                            onCheckedChange={() => handleSelectAddOn(addOn.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{addOn.name}</TableCell>
                        <TableCell className="text-muted-foreground">{addOn.service}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{addOn.provider.name}</div>
                              <div className="text-sm text-muted-foreground">{addOn.provider.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {addOn.price}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={addOn.enabled}
                            className="data-[state=checked]:bg-primary"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                              <Edit className="h-4 w-4" />
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
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum complemento encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernProviderLayout>
  );
}