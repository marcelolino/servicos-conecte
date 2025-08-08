import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, ExternalLink, Download, QrCode } from "lucide-react";

export default function MobileRedirectPage() {
  useEffect(() => {
    // Auto-redirect on mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      // Small delay to allow the page to render first
      setTimeout(() => {
        window.location.href = '/mobile';
      }, 1500);
    }
  }, []);

  const handleOpenMobileApp = () => {
    window.open('/mobile', '_blank');
  };

  const handleRedirectToMobileApp = () => {
    window.location.href = '/mobile';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Main Card */}
        <Card className="text-center shadow-lg">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              App Mobile Qserviços
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Acesse nossa versão otimizada para dispositivos móveis
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? (
                <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400">
                  <Smartphone className="w-4 h-4" />
                  <span>Redirecionando automaticamente...</span>
                </div>
              ) : (
                "Disponível para acesso em qualquer dispositivo"
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleRedirectToMobileApp}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                size="lg"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Abrir App Mobile
              </Button>
              
              <Button 
                onClick={handleOpenMobileApp}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir em Nova Aba
              </Button>
            </div>

            {/* Features List */}
            <div className="mt-6 text-left">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Recursos do App Mobile:
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Interface otimizada para touch</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Navegação intuitiva por categorias</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Serviços populares e ofertas</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Acesso rápido às funcionalidades</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Card */}
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
              <QrCode className="w-4 h-4" />
              <span className="text-sm">Compartilhe o link:</span>
            </div>
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
              {window.location.origin}/mobile
            </div>
          </CardContent>
        </Card>

        {/* Back to Main App */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={() => window.location.href = '/'}
          >
            ← Voltar ao App Principal
          </Button>
        </div>
      </div>
    </div>
  );
}