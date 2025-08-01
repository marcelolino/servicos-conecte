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

### Profile Photo Upload & Location Fix ✓
- **Date**: February 1, 2025
- **Changes**: Fixed double dialog, location save, and profile data refresh issues
- **Details**:
  - **Double Dialog Fix**: Both Card and Button elements had onClick handlers causing double triggers
  - **Solution**: Added stopPropagation to Button click and conditional onClick for Card
  - **Guards**: Disabled Card clicks during upload and when component is disabled
  - **Upload Category**: Fixed from "provider" to "profile" for regular user uploads
  - **Location API Fix**: Corrected `apiRequest` parameter order in OpenStreetMapLocationPicker
  - **Cache Invalidation**: Added queryClient.invalidateQueries after location save
  - **Profile Refresh**: Enhanced useEffect to detect data changes and update form fields
  - **Backend Working**: Both upload and location endpoints respond correctly (200 OK)
  - **Data Persistence**: Location data saves to database and appears in profile form

## Recent Changes (January 2025)

### Proximity Filter for Providers ✓
- **Date**: January 31, 2025
- **Changes**: Implemented location-based provider search with OpenStreetMap integration
- **Features**:
  - **Nearby Providers Section**: Shows when user shares location
  - **Interactive Map**: OpenStreetMap with Leaflet and React-Leaflet
  - **Custom Markers**: User location (blue) and providers (green with initials)
  - **Proximity Filters**: Distance radius (1-50km) and category selection
  - **Real-time Distance Calculation**: Haversine formula for accurate distances
  - **Smart Filtering**: Combines location, distance, and service categories
  - **Interactive Interface**: Toggle between list and map view
  - **Provider Details**: Shows distance, services, ratings, and contact options
  - **Map Interactions**: Click markers for info, popups with provider details
  - **Responsive Design**: Works on all device sizes
  - **Backend API**: `/api/providers/nearby` endpoint with comprehensive filtering
  - **Open Source**: Uses OpenStreetMap (free alternative to Google Maps)

### Provider Services Category Filter ✓
- **Date**: January 31, 2025
- **Changes**: Added category filtering in provider services management
- **Features**:
  - **Category Dropdown**: Filter services by specific categories
  - **Combined Filtering**: Works with text search for refined results
  - **Results Counter**: Shows filtered vs total services count
  - **Clear Filters**: One-click reset functionality
  - **User-friendly Interface**: Intuitive filter controls with visual feedback

### Multi-Step Checkout Enhancement ✓
- **Date**: January 30, 2025
- **Changes**: Enhanced multi-step checkout with auto-fill and PIX restoration
- **Features**:
  - **Step 1 - Scheduling & Address**: Auto-populates with user registration data
  - **Step 2 - Payment Method**: Full PIX functionality restored with QR code and timer
  - **Step 3 - Confirmation**: Final review before order confirmation
  - Progress indicator showing current step and completion status
  - Data persistence between steps using localStorage
  - Dedicated PIX component with QR code generation and copy functionality
  - Auto-fill address fields from user profile data
  - Validation and error handling for each step
  - Improved user experience with clear navigation between steps

### Cart UI Enhancement ✓
- **Date**: January 30, 2025
- **Changes**: Improved payment type selection in cart page
- **Features**:
  - Replaced dropdown with visual card-based selection
  - Enhanced text from "Escolha o tipo de cobrança" to "Como você quer pagar pelo serviço"
  - Interactive cards showing pricing types with radio button-style selection
  - Better visual feedback with icons, pricing, and selection states
  - Improved accessibility and user experience

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