import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import NodeCache from 'node-cache';
import { CronJob } from 'cron';
import { Request, Response } from 'express';
import { db } from './db';
import { fileUploads, userUploadStats } from '@shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

// Cache for image processing (1 hour TTL)
const imageCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Upload limits configuration
const UPLOAD_LIMITS = {
  client: {
    daily: 10,
    monthly: 100,
    maxFileSize: 2 * 1024 * 1024, // 2MB
    maxTotalSize: 50 * 1024 * 1024, // 50MB
  },
  provider: {
    daily: 50,
    monthly: 500,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxTotalSize: 200 * 1024 * 1024, // 200MB
  },
  admin: {
    daily: 1000,
    monthly: 10000,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxTotalSize: 1000 * 1024 * 1024, // 1GB
  }
};

// Virus scanning simulation (replace with actual antivirus integration)
const scanForVirus = async (buffer: Buffer, filename: string): Promise<{ clean: boolean; result: string }> => {
  // Simulate virus scanning delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simple check for suspicious file patterns
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /malware/i,
    /virus/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(filename) || pattern.test(buffer.toString('utf8', 0, 1000))
  );
  
  if (isSuspicious) {
    return { clean: false, result: 'infected' };
  }
  
  return { clean: true, result: 'clean' };
};

// Check user upload limits
const checkUploadLimits = async (userId: number, userType: string, fileSize: number): Promise<{ allowed: boolean; reason?: string }> => {
  const limits = UPLOAD_LIMITS[userType as keyof typeof UPLOAD_LIMITS] || UPLOAD_LIMITS.client;
  
  // Get or create user upload stats
  let stats = await db.query.userUploadStats.findFirst({
    where: eq(userUploadStats.userId, userId)
  });
  
  if (!stats) {
    stats = (await db.insert(userUploadStats).values({
      userId,
      dailyUploads: 0,
      monthlyUploads: 0,
      totalUploads: 0,
      totalSize: 0
    }).returning())[0];
  }
  
  // Check if daily/monthly limits need reset
  const now = new Date();
  const lastDailyReset = new Date(stats.lastDailyReset);
  const lastMonthlyReset = new Date(stats.lastMonthlyReset);
  
  // Reset daily counter if it's a new day
  if (now.getDate() !== lastDailyReset.getDate() || 
      now.getMonth() !== lastDailyReset.getMonth() || 
      now.getFullYear() !== lastDailyReset.getFullYear()) {
    await db.update(userUploadStats)
      .set({ dailyUploads: 0, lastDailyReset: now })
      .where(eq(userUploadStats.userId, userId));
    stats.dailyUploads = 0;
  }
  
  // Reset monthly counter if it's a new month
  if (now.getMonth() !== lastMonthlyReset.getMonth() || 
      now.getFullYear() !== lastMonthlyReset.getFullYear()) {
    await db.update(userUploadStats)
      .set({ monthlyUploads: 0, lastMonthlyReset: now })
      .where(eq(userUploadStats.userId, userId));
    stats.monthlyUploads = 0;
  }
  
  // Check limits
  if (fileSize > limits.maxFileSize) {
    return { allowed: false, reason: `Arquivo muito grande. Máximo permitido: ${(limits.maxFileSize / 1024 / 1024).toFixed(1)}MB` };
  }
  
  if (stats.totalSize + fileSize > limits.maxTotalSize) {
    return { allowed: false, reason: `Limite de armazenamento excedido. Máximo: ${(limits.maxTotalSize / 1024 / 1024).toFixed(1)}MB` };
  }
  
  if (stats.dailyUploads >= limits.daily) {
    return { allowed: false, reason: `Limite diário de uploads excedido. Máximo: ${limits.daily} por dia` };
  }
  
  if (stats.monthlyUploads >= limits.monthly) {
    return { allowed: false, reason: `Limite mensal de uploads excedido. Máximo: ${limits.monthly} por mês` };
  }
  
  return { allowed: true };
};

// Update user upload stats
const updateUploadStats = async (userId: number, fileSize: number) => {
  // First get current stats
  const currentStats = await db.query.userUploadStats.findFirst({
    where: eq(userUploadStats.userId, userId)
  });
  
  if (currentStats) {
    await db.update(userUploadStats)
      .set({
        dailyUploads: currentStats.dailyUploads + 1,
        monthlyUploads: currentStats.monthlyUploads + 1,
        totalUploads: currentStats.totalUploads + 1,
        totalSize: currentStats.totalSize + fileSize,
        lastUpload: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userUploadStats.userId, userId));
  }
};

// Advanced image processing with caching
export const processAndSaveAdvancedImage = async (
  file: Express.Multer.File,
  userId: number,
  userType: string,
  category: 'banners' | 'services' | 'categories' | 'providers' | 'avatars',
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<{ success: boolean; filePath?: string; error?: string; fileId?: number }> => {
  try {
    // Check upload limits
    const limitCheck = await checkUploadLimits(userId, userType, file.size);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.reason };
    }

    // Virus scan
    const virusScan = await scanForVirus(file.buffer, file.originalname);
    if (!virusScan.clean) {
      return { success: false, error: 'Arquivo contém vírus ou conteúdo malicioso' };
    }

    // Generate cache key
    const cacheKey = `${file.originalname}-${file.size}-${JSON.stringify(options)}`;
    const cachedResult = imageCache.get<string>(cacheKey);
    
    if (cachedResult) {
      // Return cached result
      return { success: true, filePath: cachedResult };
    }

    const {
      width = 800,
      height = 600,
      quality = 85,
      format = 'webp'
    } = options;

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}_${randomString}.${format}`;
    
    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'uploads');
    const saveDir = path.join(uploadDir, category);
    
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    
    const filepath = path.join(saveDir, filename);
    const relativeFilePath = `/uploads/${category}/${filename}`;

    // Process image with sharp
    let sharpInstance = sharp(file.buffer);

    // Resize image
    sharpInstance = sharpInstance.resize(width, height, {
      fit: 'cover',
      position: 'center'
    });

    // Apply format and quality
    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality });
        break;
    }

    // Save processed image
    await sharpInstance.toFile(filepath);

    // Cache the result
    imageCache.set(cacheKey, relativeFilePath);

    // Save to database
    const fileUpload = await db.insert(fileUploads).values({
      userId,
      filename,
      originalName: file.originalname,
      filePath: relativeFilePath,
      fileSize: file.size,
      mimeType: file.mimetype,
      category,
      virusScanned: true,
      virusScanResult: virusScan.result,
      lastAccessed: new Date()
    }).returning();

    // Update user stats
    await updateUploadStats(userId, file.size);

    return { 
      success: true, 
      filePath: relativeFilePath, 
      fileId: fileUpload[0].id 
    };

  } catch (error) {
    console.error('Error processing image:', error);
    return { success: false, error: 'Erro ao processar imagem' };
  }
};

// Advanced upload handler with all features
export const advancedUploadHandler = (category: 'banners' | 'services' | 'categories' | 'providers' | 'avatars') => {
  return async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }

      const options = {
        width: req.body.width ? parseInt(req.body.width) : undefined,
        height: req.body.height ? parseInt(req.body.height) : undefined,
        quality: req.body.quality ? parseInt(req.body.quality) : 85,
        format: req.body.format || 'webp'
      };

      const result = await processAndSaveAdvancedImage(
        file,
        user.id,
        user.userType,
        category,
        options
      );

      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }

      res.json({
        message: `${category} image uploaded successfully`,
        imageUrl: result.filePath,
        fileId: result.fileId,
        originalName: file.originalname,
        size: file.size
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
};

// Get user upload statistics
export const getUserUploadStats = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const stats = await db.query.userUploadStats.findFirst({
      where: eq(userUploadStats.userId, user.id)
    });

    const limits = UPLOAD_LIMITS[user.userType as keyof typeof UPLOAD_LIMITS] || UPLOAD_LIMITS.client;

    res.json({
      stats: stats || {
        dailyUploads: 0,
        monthlyUploads: 0,
        totalUploads: 0,
        totalSize: 0
      },
      limits,
      percentages: stats ? {
        dailyUsage: (stats.dailyUploads / limits.daily) * 100,
        monthlyUsage: (stats.monthlyUploads / limits.monthly) * 100,
        storageUsage: (stats.totalSize / limits.maxTotalSize) * 100
      } : { dailyUsage: 0, monthlyUsage: 0, storageUsage: 0 }
    });

  } catch (error) {
    console.error('Error getting upload stats:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Get file upload history
export const getFileUploadHistory = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const files = await db.query.fileUploads.findMany({
      where: and(
        eq(fileUploads.userId, user.id),
        eq(fileUploads.isActive, true)
      ),
      orderBy: [desc(fileUploads.createdAt)],
      limit: 50
    });

    res.json(files);

  } catch (error) {
    console.error('Error getting file history:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Delete uploaded file
export const deleteUploadedFile = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const fileId = parseInt(req.params.id);
    const file = await db.query.fileUploads.findFirst({
      where: and(
        eq(fileUploads.id, fileId),
        eq(fileUploads.userId, user.id)
      )
    });

    if (!file) {
      return res.status(404).json({ message: 'Arquivo não encontrado' });
    }

    // Mark as inactive in database
    await db.update(fileUploads)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(fileUploads.id, fileId));

    // Delete physical file
    const fullPath = path.join(process.cwd(), file.filePath.replace(/^\//, ''));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Update user stats
    const currentStats = await db.query.userUploadStats.findFirst({
      where: eq(userUploadStats.userId, user.id)
    });
    
    if (currentStats) {
      await db.update(userUploadStats)
        .set({
          totalSize: Math.max(0, currentStats.totalSize - file.fileSize),
          updatedAt: new Date()
        })
        .where(eq(userUploadStats.userId, user.id));
    }

    res.json({ message: 'Arquivo deletado com sucesso' });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Cleanup job - runs daily at 2 AM
const cleanupJob = new CronJob('0 2 * * *', async () => {
  try {
    console.log('Starting file cleanup job...');
    
    // Find files not accessed for 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const oldFiles = await db.query.fileUploads.findMany({
      where: and(
        lte(fileUploads.lastAccessed, thirtyDaysAgo),
        eq(fileUploads.isActive, true)
      )
    });
    
    let deletedCount = 0;
    let freedSpace = 0;
    
    for (const file of oldFiles) {
      try {
        // Delete physical file
        const fullPath = path.join(process.cwd(), file.filePath.replace(/^\//, ''));
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          freedSpace += file.fileSize;
        }
        
        // Mark as inactive
        await db.update(fileUploads)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(fileUploads.id, file.id));
        
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting file ${file.filename}:`, error);
      }
    }
    
    console.log(`Cleanup completed: ${deletedCount} files deleted, ${(freedSpace / 1024 / 1024).toFixed(2)}MB freed`);
    
  } catch (error) {
    console.error('Error in cleanup job:', error);
  }
});

// Start cleanup job
cleanupJob.start();
console.log('File cleanup job scheduled');

// Track file access for cleanup
export const trackFileAccess = async (filePath: string) => {
  try {
    await db.update(fileUploads)
      .set({ lastAccessed: new Date() })
      .where(eq(fileUploads.filePath, filePath));
  } catch (error) {
    console.error('Error tracking file access:', error);
  }
};