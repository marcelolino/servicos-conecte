import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import ProviderLayout from "@/components/layout/provider-layout";
import { Search, User, Edit, Trash2 } from "lucide-react";

export default function ProviderPackages() {
  const { user, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("Nenhuma ação");
  const [filterAll, setFilterAll] = useState("Todo");
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  // Mock data for packages
  const packages = [
    {
      id: "1",
      name: "Fusão Gourmet Global",
      provider: {
        name: "Felix Harris",
        email: "demo@provider.com"
      },
      price: "$66.00",
      status: "active",
      enabled: true
    },
    {
      id: "2",
      name: "Pacote de proteção da casa inteligente",
      provider: {
        name: "Felix Harris",
        email: "demo@provider.com"
      },
      price: "$30.00",
      status: "active",
      enabled: true
    },
    {
      id: "3",
      name: "Carpintaria e higienização",
      provider: {
        name: "Felix Harris",
        email: "demo@provider.com"
      },
      price: "$37.00",
      status: "active",
      enabled: true
    },
    {
      id: "4",
      name: "Pacote de serviço de lavanderia",
      provider: {
        name: "Felix Harris",
        email: "demo@provider.com"
      },
      price: "$36.00",
      status: "active",
      enabled: true
    }
  ];

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pkg.provider.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackages(prev => 
      prev.includes(packageId) 
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPackages.length === filteredPackages.length) {
      setSelectedPackages([]);
    } else {
      setSelectedPackages(filteredPackages.map(pkg => pkg.id));
    }
  };

  if (isLoading) {
    return (
      <ProviderLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Pacotes</h1>
          <Button className="bg-primary text-primary-foreground">
            ⊕ Adicionar pacote
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

        {/* Packages Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="text-primary-foreground font-medium w-12">
                      <Checkbox
                        checked={selectedPackages.length === filteredPackages.length && filteredPackages.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="border-primary-foreground data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary"
                      />
                    </TableHead>
                    <TableHead className="text-primary-foreground font-medium">Nome</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Provedor</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Preço</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Estado</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPackages.length > 0 ? (
                    filteredPackages.map((pkg) => (
                      <TableRow key={pkg.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedPackages.includes(pkg.id)}
                            onCheckedChange={() => handleSelectPackage(pkg.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{pkg.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{pkg.provider.name}</div>
                              <div className="text-sm text-muted-foreground">{pkg.provider.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {pkg.price}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={pkg.enabled}
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
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum pacote encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProviderLayout>
  );
}