import { useParams } from "wouter";

export default function TestProfile() {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Teste de Perfil</h1>
        <p className="text-lg">ID do prestador: {id}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Se você está vendo esta mensagem, o roteamento está funcionando!
        </p>
      </div>
    </div>
  );
}