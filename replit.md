# Qserviços - Service Marketplace Platform

## Overview
Qserviços is a comprehensive service marketplace platform designed to connect service providers with clients. It offers a user-friendly, intelligent, and secure ecosystem for service discovery, booking, and payment. Key capabilities include geolocation services for proximity-based searches, integrated payment solutions (Stripe, MercadoPago), and real-time communication features. The platform features a dynamic charging types system where admins can configure service pricing models, and providers can set multiple pricing options that are displayed on service cards with suggested price fallbacks. The project aims to provide a seamless experience for both service providers and clients, facilitating efficient service transactions.

## User Preferences
- Language: Portuguese (Brazilian)
- Focus on practical functionality over complex features
- Prefer simple, direct solutions that work reliably
- Prioritize user experience and error-free operations

## System Architecture
The platform is built with a modern tech stack to ensure scalability, performance, and a rich user experience.
- **Frontend**: React with TypeScript, Vite, TailwindCSS for styling, and shadcn/ui for UI components. The design emphasizes a clean, intuitive interface with features like multi-step checkouts, comprehensive admin dashboards, and mobile-optimized views inspired by Flutter.
- **Backend**: Node.js with Express and TypeScript, providing robust API endpoints for all platform functionalities.
- **Database**: PostgreSQL, managed with Drizzle ORM for efficient data handling.
- **File Storage**: Local file system managed with `multer` for secure uploads of user and provider documents/images. Simplified upload handlers are used to avoid complex processing issues.
- **Geolocation**: Progressive permission checking for geolocation, leveraging OpenStreetMap for mapping and reverse geocoding to provide location-based services and proximity filtering.
- **Payment Flow**: Enhanced multi-step checkout processes with auto-fill capabilities and support for various payment methods, including PIX.
- **Admin & Reports**: A comprehensive admin dashboard built with shadcn/ui, featuring modern sidebar navigation and an extensive reporting system that includes transaction, business, booking, and provider performance analytics with interactive filters and data visualization.
- **Mobile Integration**: A separate mobile-first client (`/mobile-app/`) is integrated, consuming existing APIs and designed with a Flutter-inspired interface for a native-like experience. Features complete reservation system with inline navigation, status filtering, and real-time updates.

## External Dependencies
- **Mapping & Geolocation**: OpenStreetMap (for map services and reverse geocoding)
- **Payment Gateways**: Stripe, MercadoPago (for processing payments, including PIX)
- **Database**: PostgreSQL
- **File Uploads**: `multer` (Node.js middleware for handling multipart/form-data)
- **Charting**: Recharts (for data visualization in admin reports)
- **UI Components**: shadcn/ui

## Recent Changes (2025-01-18)

### Provider Services Interface Redesign
**Status**: ✅ Completed

**Changes Made**:
1. **Navigation Menu Update** - Changed "Minhas Inscrições" to "Meus Serviços" in provider sidebar
   - Updated menu title to better reflect functionality
   - Improved clarity for service management

2. **Complete Page Redesign** - Transformed provider services page with modern card-based layout
   - Replaced table layout with responsive grid of service cards
   - Added service image thumbnails from `/uploads/services/` folder
   - Implemented visual status badges and category indicators
   - Created detailed modal dialogs for complete service information

3. **Read-Only Service Details** - All service fields are now display-only for providers
   - Service name, description, duration, materials, requirements: read-only
   - Images managed by admin only
   - Clear separation between admin-controlled and provider-controlled data

4. **Editable Charging Types Only** - Providers can only edit their pricing
   - "Preços" button redirects to charging type configuration
   - Maintains business rule that only admins edit service catalog details
   - Providers manage their own pricing strategies

**Files Modified**:
- `client/src/components/layout/provider-sidebar.tsx` - Menu title update
- `client/src/pages/provider-service-subscriptions.tsx` - Complete interface redesign

### Service Synchronization and Bulk Re-adoption
**Status**: ✅ Completed

**Changes Made**:
1. **Database Cleanup** - Synchronized provider services with admin catalog
   - Created backup table: `provider_services_backup_20250118`
   - Removed 20 orphaned services without catalog references
   - Preserved 4 services with order history (marked for reconfiguration)
   - Cleaned up orphaned charging types

2. **Bulk Re-adoption Feature** - Added mass service adoption functionality
   - "Adotar Todos" button to adopt all available services at once
   - "Adotar Categoria" button for category-specific bulk adoption
   - Smart filtering to show only non-adopted services
   - Progress indicators and detailed success/error reporting
   - Uses suggested prices from admin catalog as defaults

3. **Enhanced UI Indicators** - Improved service status visualization
   - Color-coded counters for adopted vs available services
   - Real-time updates during bulk operations
   - Better filtering and search capabilities

**Files Modified**:
- `client/src/pages/provider-all-services.tsx` - Bulk adoption functionality
- Database: Service synchronization and cleanup

### Admin Services Catalog Filtering Enhancement
**Status**: ✅ Completed

**Changes Made**:
1. **Complete Filter Interface** - Added comprehensive filtering system to admin services catalog
   - Search by service name, description, or category
   - Filter by category dropdown with all available categories
   - Filter by status (Active/Inactive/All)
   - **NEW**: Filter by charging type using dynamic types from admin panel
   - Clear filters button when any filter is active

2. **Enhanced UI Components** - Improved filtering user experience
   - Visual filter section with organized grid layout
   - Real-time results counter showing filtered vs total services
   - Dynamic charging type labels fetched from database
   - Professional filter interface matching design requirements

3. **Smart Filtering Logic** - Implemented multi-criteria filtering system
   - Combines search term with category, status, and charging type filters
   - Case-insensitive search across multiple fields
   - Efficient filter state management with clear functionality

**Files Modified**:
- `client/src/pages/admin-services-catalog.tsx` - Complete filtering interface

### Media Management System Implementation
**Status**: ✅ Completed

**Changes Made**:
1. **Admin Media Management Interface** - Implemented comprehensive media management system at `/admin-media`
   - Organizes images by categories: Avatars, Banners, Categories, Documents, General, Logos, Portfolio, Providers, Services
   - Displays proper image counts and file information
   - Responsive grid layout with category browsing
   - Upload functionality for each category with drag-and-drop support

2. **Database Schema Fixes** - Resolved missing columns in provider_services table
   - Added `suggested_min_price` column for pricing fallbacks
   - Added `suggested_max_price` column for pricing ranges  
   - Added `tags` column for service tagging functionality

3. **Upload System Authentication Fix** - Corrected JWT authentication for file uploads
   - Fixed malformed token issues by using proper fetch with FormData
   - Maintained JWT authentication with Authorization headers
   - Supports all media categories with proper permissions

**Files Modified**:
- `client/src/pages/admin-media.tsx` - Complete media management interface
- `server/routes.ts` - Upload route authentication
- `shared/schema.ts` - Database schema updates
- SQL direct fixes for missing columns

### Dynamic Charging Types System Integration  
**Status**: ✅ Completed (2025-01-17)

**Changes Made**:
1. **Provider Service Configuration** - Updated `ServiceChargingTypesComponent` to dynamically load charging types from admin panel instead of hardcoded enums
   - Fetches charging types from `/api/admin/charging-types` endpoint
   - Uses dynamic form rendering with proper validation
   - Supports conditional price fields (hidden for quote types)
   - Enhanced package quantity fields with dynamic type detection

2. **Home Page Service Cards Enhancement** - Enhanced service cards to display multiple charging types instead of just minimum price
   - Shows up to 3 charging types with proper labels fetched from admin panel
   - Displays pricing format per type (hourly, fixed, package with quantities)
   - Added suggested price fallback when providers haven't set prices
   - Created public `/api/charging-types` endpoint for dynamic type labels

3. **Suggested Price Fallback Logic** - Services without provider prices now show admin suggested prices
   - Falls back to `service.suggestedMinPrice` when no provider prices set
   - Clear visual distinction between provider prices and suggested prices
   - Proper handling of quote-only services

**Files Modified**:
- `client/src/components/service-charging-types.tsx` - Dynamic charging types integration
- `client/src/pages/home.tsx` - Enhanced service cards with multiple pricing display
- `server/routes.ts` - Added public charging types endpoint
- `replit.md` - Updated project documentation

**Technical Implementation**:
- Dynamic form rendering based on admin-configured charging types
- Enhanced service cards showing multiple pricing options
- Proper TypeScript integration with CustomChargingType schema
- Public API endpoint for charging type metadata without authentication