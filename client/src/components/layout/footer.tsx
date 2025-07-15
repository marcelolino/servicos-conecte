import { Link } from "wouter";
import { Wrench, Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Wrench className="h-8 w-8 text-primary mr-2" />
              <h3 className="text-xl font-bold text-foreground">Qserviços</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Conectando clientes e prestadores de serviços de forma rápida e segura.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Para Clientes</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Como funciona
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Categorias
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Preços
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-foreground transition-colors">
                  Suporte
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Para Prestadores</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/register?type=provider" className="hover:text-foreground transition-colors">
                  Seja um prestador
                </Link>
              </li>
              <li>
                <Link href="/requirements" className="hover:text-foreground transition-colors">
                  Requisitos
                </Link>
              </li>
              <li>
                <Link href="/commissions" className="hover:text-foreground transition-colors">
                  Comissões
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-foreground transition-colors">
                  Centro de ajuda
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Empresa</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  Sobre nós
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-foreground transition-colors">
                  Carreiras
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 Qserviços. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
