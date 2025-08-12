import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface PageConfiguration {
  id: number;
  pageKey: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function LegalPages() {
  const [match, params] = useRoute("/legal/:pageKey");
  const pageKey = params?.pageKey;

  const { data: pageConfig, isLoading, error } = useQuery<PageConfiguration>({
    queryKey: ["/api/page-configurations", pageKey],
    enabled: !!pageKey,
    refetchOnWindowFocus: false,
  });

  if (!pageKey) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Página não encontrada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                A página solicitada não foi encontrada.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !pageConfig) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Página não encontrada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                A página solicitada não foi encontrada ou não está disponível no momento.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!pageConfig.isActive) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Página indisponível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta página está temporariamente indisponível.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {pageConfig.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                {pageConfig.content}
              </pre>
            </div>
            <div className="mt-8 pt-4 border-t text-xs text-muted-foreground">
              Última atualização: {new Date(pageConfig.updatedAt).toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Component for specific legal pages with direct routing
export function AboutUsPage() {
  const { data: pageConfig, isLoading, error } = useQuery<PageConfiguration>({
    queryKey: ["/api/page-configurations", "about_us"],
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !pageConfig || !pageConfig.isActive) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>Quem Somos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Informações sobre a empresa em breve.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {pageConfig.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                {pageConfig.content}
              </pre>
            </div>
            <div className="mt-8 pt-4 border-t text-xs text-muted-foreground">
              Última atualização: {new Date(pageConfig.updatedAt).toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function TermsAndConditionsPage() {
  const { data: pageConfig, isLoading, error } = useQuery<PageConfiguration>({
    queryKey: ["/api/page-configurations", "terms_and_conditions"],
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !pageConfig || !pageConfig.isActive) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>Termos e Condições</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Termos e condições em breve.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {pageConfig.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                {pageConfig.content}
              </pre>
            </div>
            <div className="mt-8 pt-4 border-t text-xs text-muted-foreground">
              Última atualização: {new Date(pageConfig.updatedAt).toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function PrivacyPolicyPage() {
  const { data: pageConfig, isLoading, error } = useQuery<PageConfiguration>({
    queryKey: ["/api/page-configurations", "privacy_policy"],
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !pageConfig || !pageConfig.isActive) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>Política de Privacidade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Política de privacidade em breve.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {pageConfig.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                {pageConfig.content}
              </pre>
            </div>
            <div className="mt-8 pt-4 border-t text-xs text-muted-foreground">
              Última atualização: {new Date(pageConfig.updatedAt).toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}