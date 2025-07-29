# Qserviços - Service Marketplace Platform

## Project Overview
A comprehensive service marketplace platform that connects service providers and clients through an intelligent, secure, and user-friendly ecosystem. Built with React frontend, Node.js backend, PostgreSQL database, and includes features like geolocation services, payment integrations, and real-time communication.



## Current State
- ✅ Provider registration process working with image/document uploads
- ✅ Geolocation system properly manages permissions
- ✅ Authentication and user management functional
- ✅ Database operations working with PostgreSQL
- ✅ Static file serving for uploads configured
- ✅ Complete services API endpoints for native app consumption
- ✅ API documentation updated with React Native and Flutter examples

## Recent Changes (January 2025)

### Services API Enhancement ✓
- **Date**: January 29, 2025
- **Changes**: Updated comprehensive API documentation with new `/services` endpoints
- **Features**:
  - Complete filtering by category, city, state, and search terms
  - Popular services endpoint based on provider ratings
  - Advanced search with price range filtering
  - Service-by-provider and service-by-category endpoints
  - API health check endpoint (`/api/services/test`)
  - React Native and Flutter integration examples

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