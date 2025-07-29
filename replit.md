# Qserviços - Service Marketplace Platform

## Project Overview
A comprehensive service marketplace platform that connects service providers and clients through an intelligent, secure, and user-friendly ecosystem. Built with React frontend, Node.js backend, PostgreSQL database, and includes features like geolocation services, payment integrations, and real-time communication.

## Recent Changes (January 2025)

### Image Upload System Fixes ✓
- **Date**: January 29, 2025
- **Issue**: Provider registration failing due to upload errors for profile photos, logos, and documents
- **Solution**: 
  - Fixed TypeScript type definitions for multer file uploads
  - Created separate upload configurations for images vs documents  
  - Added support for both images and PDFs for document uploads
  - Implemented simplified upload handlers for registration process
  - Fixed memory storage handling in multer configuration

### Geolocation Permission Improvements ✓
- **Date**: January 29, 2025
- **Issue**: Browser requesting location permission repeatedly on every site visit
- **Solution**:
  - Enhanced permission checking using `navigator.permissions` API
  - Added localStorage tracking for permission requests
  - Improved logic to only request permission once unless denied
  - Added automatic location detection for granted permissions

## Current State
- ✅ Provider registration process working with image/document uploads
- ✅ Geolocation system properly manages permissions
- ✅ Authentication and user management functional
- ✅ Database operations working with PostgreSQL
- ✅ Static file serving for uploads configured

## Architecture
- **Frontend**: React with TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **File Storage**: Local file system with multer for uploads
- **Payment**: Stripe and MercadoPago integrations
- **Real-time**: WebSocket support for chat functionality

## User Preferences
- Language: Portuguese (Brazilian)
- Focus on practical functionality over complex features
- Prefer simple, direct solutions that work reliably
- Prioritize user experience and error-free operations

## Technical Decisions
- Use simplified upload handlers for registration to avoid Sharp processing issues
- Implement progressive permission checking for geolocation
- Store user preferences and location data in localStorage
- Separate upload endpoints for different file types (images vs documents)

## Next Steps
- Monitor upload functionality in production
- Consider implementing image compression for uploaded files
- Add user feedback mechanisms for location services
- Optimize geolocation accuracy and reverse geocoding