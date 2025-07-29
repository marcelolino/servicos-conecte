import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), 'uploads');
const bannersDir = path.join(uploadDir, 'banners');
const servicesDir = path.join(uploadDir, 'services');
const categoriesDir = path.join(uploadDir, 'categories');
const providersDir = path.join(uploadDir, 'providers');
const avatarsDir = path.join(uploadDir, 'avatars');
const generalDir = path.join(uploadDir, 'general');
const portfolioDir = path.join(uploadDir, 'portfolio');

[uploadDir, bannersDir, servicesDir, categoriesDir, providersDir, avatarsDir, generalDir, portfolioDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Document upload configuration that accepts both images and PDFs
const documentFileFilter = (req: any, file: any, cb: any) => {
  // Accept image files and PDFs for document uploads
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only image files and PDFs are allowed for documents'), false);
  }
};

export const uploadDocument = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  },
});

// Simple provider image upload handler for registration (no processing)
export const uploadSimpleProviderImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Ensure providers directory exists
    const providersDir = path.join(process.cwd(), 'uploads', 'providers');
    if (!fs.existsSync(providersDir)) {
      fs.mkdirSync(providersDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const filename = `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
    const finalPath = path.join(providersDir, filename);

    // Write buffer to file (since we're using memory storage)
    fs.writeFileSync(finalPath, req.file.buffer);

    const imageUrl = `/uploads/providers/${filename}`;
    res.json({ 
      message: 'Provider image uploaded successfully',
      imageUrl,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Simple provider image upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload provider image',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Simple client avatar upload handler for registration (no processing)
export const uploadSimpleClientAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Ensure avatars directory exists
    const avatarsDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const filename = `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
    const finalPath = path.join(avatarsDir, filename);

    // Write buffer to file (since we're using memory storage)
    fs.writeFileSync(finalPath, req.file.buffer);

    const imageUrl = `/uploads/avatars/${filename}`;
    res.json({ 
      message: 'Avatar uploaded successfully',
      imageUrl,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Simple avatar upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload avatar',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Extend Request type to include file
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
  }
}

// Image processing and saving function
export const processAndSaveImage = async (
  file: Express.Multer.File,
  category: 'banners' | 'services' | 'categories' | 'providers' | 'avatars' | 'general' | 'portfolio',
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<string> => {
  const {
    width = 800,
    height = 600,
    quality = 85,
    format = 'jpeg'
  } = options;

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const filename = `${timestamp}_${randomString}.${format}`;
  
  // Determine save directory
  const saveDir = path.join(uploadDir, category);
  const filepath = path.join(saveDir, filename);

  // Process image with sharp
  let sharpInstance = sharp(file.buffer);

  // Resize image
  sharpInstance = sharpInstance.resize(width, height, {
    fit: 'cover',
    position: 'center'
  });

  // Set format and quality
  if (format === 'jpeg') {
    sharpInstance = sharpInstance.jpeg({ quality });
  } else if (format === 'png') {
    sharpInstance = sharpInstance.png({ quality });
  } else if (format === 'webp') {
    sharpInstance = sharpInstance.webp({ quality });
  }

  // Save processed image
  await sharpInstance.toFile(filepath);

  // Return relative URL path
  return `/uploads/${category}/${filename}`;
};

// Upload handlers for different image types
export const uploadBannerImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = await processAndSaveImage(req.file, 'banners', {
      width: 1200,
      height: 400,
      quality: 90,
      format: 'webp'
    });

    res.json({ 
      message: 'Banner image uploaded successfully',
      imageUrl,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Banner image upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload banner image',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const uploadServiceImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = await processAndSaveImage(req.file, 'services', {
      width: 800,
      height: 600,
      quality: 85,
      format: 'webp'
    });

    res.json({ 
      message: 'Service image uploaded successfully',
      imageUrl,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Service image upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload service image',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const uploadCategoryImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = await processAndSaveImage(req.file, 'categories', {
      width: 400,
      height: 400,
      quality: 85,
      format: 'webp'
    });

    res.json({ 
      message: 'Category image uploaded successfully',
      imageUrl,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Category image upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload category image',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const uploadProviderImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = await processAndSaveImage(req.file, 'providers', {
      width: 400,
      height: 400,
      quality: 85,
      format: 'webp'
    });

    res.json({ 
      message: 'Provider image uploaded successfully',
      imageUrl,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Provider image upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload provider image',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Multiple files upload handler
export const uploadMultipleImages = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    let category = req.body.category || 'services';
    
    // Ensure category ends with 's' for folder names
    if (!category.endsWith('s')) {
      switch(category) {
        case 'banner':
          category = 'banners';
          break;
        case 'service':
          category = 'services';
          break;
        case 'category':
          category = 'categories';
          break;
        case 'provider':
          category = 'providers';
          break;
        case 'avatar':
          category = 'avatars';
          break;
        case 'portfolio':
          category = 'portfolio';
          break;
        default:
          category = 'general';
      }
    }
    
    const uploadPromises = files.map(file => 
      processAndSaveImage(file, category as any, {
        width: 800,
        height: 600,
        quality: 85,
        format: 'webp'
      })
    );

    const imageUrls = await Promise.all(uploadPromises);

    res.json({
      message: 'Images uploaded successfully',
      imageUrls,
      count: imageUrls.length
    });
  } catch (error) {
    console.error('Multiple images upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload images',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete image function
export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { imagePath } = req.body;
    
    if (!imagePath) {
      return res.status(400).json({ message: 'Image path is required' });
    }

    // Convert URL path to file system path
    const filepath = path.join(process.cwd(), imagePath);
    
    // Check if file exists
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ message: 'Image not found' });
    }
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ 
      message: 'Failed to delete image',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get image info
export const getImageInfo = async (req: Request, res: Response) => {
  try {
    const { imagePath } = req.params;
    const filepath = path.join(process.cwd(), imagePath);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const stats = fs.statSync(filepath);
    const metadata = await sharp(filepath).metadata();

    res.json({
      path: imagePath,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      channels: metadata.channels
    });
  } catch (error) {
    console.error('Get image info error:', error);
    res.status(500).json({ 
      message: 'Failed to get image info',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};