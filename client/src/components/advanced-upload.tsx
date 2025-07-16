import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileImage, Trash2, Eye, Download, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AdvancedUploadProps {
  category: 'banners' | 'services' | 'categories' | 'providers' | 'avatars';
  onUploadSuccess?: (imageUrl: string, fileId: number) => void;
  maxWidth?: number;
  maxHeight?: number;
  acceptedFormats?: string[];
}

interface UploadStats {
  stats: {
    dailyUploads: number;
    monthlyUploads: number;
    totalUploads: number;
    totalSize: number;
  };
  limits: {
    daily: number;
    monthly: number;
    maxFileSize: number;
    maxTotalSize: number;
  };
  percentages: {
    dailyUsage: number;
    monthlyUsage: number;
    storageUsage: number;
  };
}

interface FileUpload {
  id: number;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  category: string;
  virusScanned: boolean;
  virusScanResult: string;
  lastAccessed: string;
  createdAt: string;
}

export default function AdvancedUpload({ 
  category, 
  onUploadSuccess, 
  maxWidth = 800, 
  maxHeight = 600,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp']
}: AdvancedUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadOptions, setUploadOptions] = useState({
    width: maxWidth,
    height: maxHeight,
    quality: 85,
    format: 'webp' as 'jpeg' | 'png' | 'webp'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch upload statistics
  const { data: uploadStats } = useQuery<UploadStats>({
    queryKey: ['/api/upload/stats'],
    refetchInterval: 30000 // Update every 30 seconds
  });

  // Fetch file upload history
  const { data: fileHistory } = useQuery<FileUpload[]>({
    queryKey: ['/api/upload/history'],
    refetchInterval: 30000
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('width', uploadOptions.width.toString());
      formData.append('height', uploadOptions.height.toString());
      formData.append('quality', uploadOptions.quality.toString());
      formData.append('format', uploadOptions.format);

      const response = await apiRequest('POST', `/api/upload/advanced/${category}`, formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload realizado com sucesso!",
        description: `Imagem processada e otimizada para ${category}`,
      });
      
      if (onUploadSuccess) {
        onUploadSuccess(data.imageUrl, data.fileId);
      }
      
      // Refresh stats and history
      queryClient.invalidateQueries({ queryKey: ['/api/upload/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/upload/history'] });
      
      setSelectedFile(null);
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast({
        title: "Erro no upload",
        description: error.message || "Erro ao fazer upload da imagem",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest('DELETE', `/api/upload/file/${fileId}`);
    },
    onSuccess: () => {
      toast({
        title: "Arquivo deletado",
        description: "O arquivo foi removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/upload/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/upload/history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar",
        description: error.message || "Erro ao deletar arquivo",
        variant: "destructive",
      });
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && acceptedFormats.includes(file.type)) {
      setSelectedFile(file);
    } else {
      toast({
        title: "Formato não suportado",
        description: "Por favor, selecione um arquivo de imagem válido",
        variant: "destructive",
      });
    }
  }, [acceptedFormats, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    setUploadProgress(10);
    uploadMutation.mutate(selectedFile);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getVirusStatusIcon = (result: string) => {
    switch (result) {
      case 'clean':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'infected':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const canUpload = uploadStats && 
    uploadStats.percentages.dailyUsage < 100 && 
    uploadStats.percentages.monthlyUsage < 100 && 
    uploadStats.percentages.storageUsage < 100;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Avançado - {category}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Options */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="width">Largura</Label>
                  <Input
                    id="width"
                    type="number"
                    value={uploadOptions.width}
                    onChange={(e) => setUploadOptions(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                    min="100"
                    max="2000"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Altura</Label>
                  <Input
                    id="height"
                    type="number"
                    value={uploadOptions.height}
                    onChange={(e) => setUploadOptions(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                    min="100"
                    max="2000"
                  />
                </div>
                <div>
                  <Label htmlFor="quality">Qualidade</Label>
                  <Input
                    id="quality"
                    type="number"
                    value={uploadOptions.quality}
                    onChange={(e) => setUploadOptions(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <Label htmlFor="format">Formato</Label>
                  <Select 
                    value={uploadOptions.format} 
                    onValueChange={(value: 'jpeg' | 'png' | 'webp') => setUploadOptions(prev => ({ ...prev, format: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webp">WebP</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Drag and Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'
                } ${!canUpload ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => canUpload && fileInputRef.current?.click()}
              >
                <FileImage className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">
                  {selectedFile ? selectedFile.name : 'Arraste uma imagem aqui ou clique para selecionar'}
                </p>
                <p className="text-sm text-gray-500">
                  Formatos suportados: {acceptedFormats.join(', ')}
                </p>
                
                {!canUpload && (
                  <Badge variant="destructive" className="mt-2">
                    Limite de upload atingido
                  </Badge>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats.join(',')}
                onChange={handleFileSelect}
                className="hidden"
                disabled={!canUpload}
              />

              {/* Upload Progress */}
              {uploadMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processando...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending || !canUpload}
                className="w-full"
              >
                {uploadMutation.isPending ? 'Processando...' : 'Fazer Upload'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {uploadStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Uploads Diários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uploadStats.stats.dailyUploads}</div>
                  <div className="text-xs text-gray-500">de {uploadStats.limits.daily}</div>
                  <Progress value={uploadStats.percentages.dailyUsage} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Uploads Mensais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uploadStats.stats.monthlyUploads}</div>
                  <div className="text-xs text-gray-500">de {uploadStats.limits.monthly}</div>
                  <Progress value={uploadStats.percentages.monthlyUsage} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Armazenamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatFileSize(uploadStats.stats.totalSize)}</div>
                  <div className="text-xs text-gray-500">de {formatFileSize(uploadStats.limits.maxTotalSize)}</div>
                  <Progress value={uploadStats.percentages.storageUsage} className="mt-2" />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fileHistory?.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <img 
                        src={file.filePath} 
                        alt={file.originalName}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div>
                        <div className="font-medium">{file.originalName}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span>{formatFileSize(file.fileSize)}</span>
                          <span>•</span>
                          <span>{file.category}</span>
                          <span>•</span>
                          {getVirusStatusIcon(file.virusScanResult)}
                          <span>{file.virusScanResult}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.filePath, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(file.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}