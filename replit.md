# Qserviços - Service Provider Platform

## Overview

Qserviços is a full-stack service provider platform that connects clients with service providers across various categories (plumbing, cleaning, driving, etc.). The application features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data storage and Drizzle ORM for database operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Advanced Image Upload System Implementation (January 16, 2025)
- ✓ Implemented comprehensive image upload system with multer and sharp
- ✓ Created reusable ImageUpload component with drag-and-drop functionality
- ✓ Added image processing and optimization (WebP conversion, resizing)
- ✓ Built media management page for admin dashboard
- ✓ Integrated image upload with banner management system
- ✓ Created upload test page for demonstration
- ✓ Added file validation and error handling
- ✓ Implemented progress tracking for uploads
- ✓ Added static file serving for uploaded images
- ✓ Created organized folder structure for different image types
- ✓ Fixed authentication issue in ImageUpload component
- ✓ Added image upload to admin service creation form
- ✓ Enhanced category listings to display uploaded images
- ✓ Integrated service image upload in provider dashboard
- ✓ Created comprehensive media management interface with statistics
- ✓ Added portfolio image management for providers
- ✓ Connected all image uploads with core business logic
- ✓ Implemented image display across category and service listings
- ✓ Completed service management form image upload integration
- ✓ Created comprehensive user profile page with avatar upload
- ✓ Added image upload functionality to service creation and editing
- ✓ Integrated image upload system with all key business processes
- ✓ Fixed service request acceptance authentication bug (403 error resolved)
- ✓ Added professional category images for all 25+ service categories
- ✓ Downloaded high-quality images from Unsplash for better visual appeal
- ✓ Implemented complete category management system with edit/delete functionality
- ✓ Added category images display on home page for enhanced user experience
- ✓ Built comprehensive admin category editing interface with image upload

### Advanced Upload Features Implementation (January 16, 2025)
- ✓ Implemented user upload limits based on user type (client/provider/admin)
- ✓ Added virus scanning simulation for uploaded files
- ✓ Created intelligent image cache system with 1-hour TTL
- ✓ Built automatic file cleanup system running daily at 2 AM
- ✓ Added comprehensive file tracking in database
- ✓ Implemented upload statistics and monitoring
- ✓ Created advanced upload component with progress tracking
- ✓ Added file format conversion and quality optimization
- ✓ Built file history management with delete functionality
- ✓ Integrated with existing upload endpoints seamlessly
- ✓ Added upload demo page showcasing all features
- ✓ Implemented proper error handling and user feedback
- ✓ Created database schema for file uploads and user stats
- ✓ Added comprehensive upload API endpoints
- ✓ Tested all functionality including limits and virus scanning

### Transaction Management System Implementation (January 21, 2025)
- ✓ Implemented hierarchical "Transações" menu in admin dashboard with 4 organized submenus
- ✓ Extended database schema with provider earnings and withdrawal request tables
- ✓ Added provider_earnings table with platform fee calculation and withdrawal tracking
- ✓ Created withdrawal_requests table with bank info, PIX key support, and admin processing
- ✓ Implemented comprehensive backend storage methods for earnings and withdrawals
- ✓ Added API routes for provider earnings tracking and withdrawal request management
- ✓ Built AdminPayments page with transaction overview and payment method filtering
- ✓ Created AdminCashPayments page for cash payment confirmation workflow
- ✓ Implemented AdminEarnings page with platform fee breakdown and provider statistics
- ✓ Built AdminWithdrawalRequests page with approve/reject workflow and admin notes
- ✓ Added expand/collapse functionality for hierarchical menu navigation in admin sidebar
- ✓ Integrated all transaction pages with admin dashboard routing system
- ✓ Created comprehensive statistics cards for each transaction page
- ✓ Added proper authentication middleware for provider and admin transaction endpoints
- ✓ Implemented withdrawal request validation with available balance checking
- ✓ Added automatic earnings withdrawal marking when requests are approved
- ✓ Fixed API parameter order issue in admin withdrawal processing
- ✓ Completed end-to-end testing with successful withdrawal approval workflow

### Provider Booking Management System Implementation (January 21, 2025)
- ✓ Implemented hierarchical "Reservas" menu in provider dashboard with 6 organized submenus
- ✓ Added comprehensive booking icons and navigation structure in provider layout
- ✓ Created ProviderBookingsPage with tabbed interface matching reference designs
- ✓ Built booking statistics cards showing total, pending, accepted, and completed bookings
- ✓ Implemented search and filtering functionality for booking management
- ✓ Added BookingsTable component with detailed booking information display
- ✓ Created status-based filtering system with color-coded badges
- ✓ Integrated URL-based tab navigation for different booking status views
- ✓ Built ProviderBookingDetailsPage with comprehensive booking details view
- ✓ Added booking status management with accept, start, complete, and cancel actions
- ✓ Implemented modal dialogs for booking status updates with notes support
- ✓ Created responsive booking layout with service and customer information cards
- ✓ Added location display and service scheduling information
- ✓ Integrated booking navigation with "View Details" functionality
- ✓ Registered all booking routes in App.tsx routing system
- ✓ Implemented booking status progression control for providers
- ✓ Added proper Portuguese translations for all booking interface elements
- ✓ Fixed booking details page routing and mutation errors
- ✓ Implemented action buttons (visualizar, imprimir, aceitar, ignorar) matching reference design
- ✓ Added booking summary layout with detailed cost breakdown in Portuguese
- ✓ Integrated booking setup sidebar with payment status and action buttons
- ✓ Fixed menu navigation bug - maintains expanded state across booking pages

### Service Scheduling Control Implementation (January 18, 2025)
- ✓ Added service status progression control for clients
- ✓ Implemented "Iniciar Serviço" button for accepted services
- ✓ Created "Finalizar Serviço" button for in-progress services
- ✓ Added service control mutations with proper error handling
- ✓ Integrated scheduled time display in service request cards
- ✓ Removed time restrictions from checkout to allow immediate service testing
- ✓ Enhanced client dashboard with action buttons based on service status
- ✓ Added debugging logs to troubleshoot button visibility
- ✓ Updated storage layer to include provider user information
- ✓ Fixed "toString is not a function" error in service completion
- ✓ Implemented proper date handling for completedAt field
- ✓ Added loading states to prevent "Acesso Negado" flash during auth check
- ✓ Corrected authentication loading state in client and provider dashboards
- ✓ Fixed logout "Acesso Negado" issue by adding isLoggingOut state
- ✓ Applied loading state fix to all protected pages (admin, profile, service-management, etc.)
- ✓ Improved logout flow with proper redirection and loading states

### Provider Wallet Implementation (January 22, 2025)
- ✓ Replaced "Transações" menu with unified "Carteira do Provedor" section
- ✓ Created comprehensive provider wallet page with 6 key statistics cards
- ✓ Implemented wallet layout matching reference design with cash balance, withdrawal balance, and total earnings
- ✓ Added tabbed interface with withdrawal requests, payment history, and upcoming payments
- ✓ Integrated with existing provider earnings and withdrawal request APIs
- ✓ Added proper currency formatting and status badge displays
- ✓ Created responsive card layout with action buttons for balance adjustment and withdrawal requests
- ✓ Unified all transaction-related functionality into single wallet interface

### Admin Dashboard Improvements (January 15, 2025)
- ✓ Implemented complete admin dashboard redesign with sidebar navigation
- ✓ Added proper provider management with approval/rejection functionality
- ✓ Fixed issue where providers weren't displaying for approval
- ✓ Created comprehensive statistics dashboard with real-time data
- ✓ Added search and filter functionality for provider management
- ✓ Implemented detailed provider profile modal with action buttons
- ✓ Fixed rating display errors for providers with null ratings
- ✓ Added responsive table layout for provider listings

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with custom shadcn/ui styling
- **Styling**: Tailwind CSS with CSS variables for theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state, React Context for authentication
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with bcrypt for password hashing
- **Session Management**: PostgreSQL sessions with connect-pg-simple

### Database Architecture
- **ORM**: Drizzle ORM with type-safe queries
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema**: Located in `shared/schema.ts` for type sharing between frontend and backend
- **Migrations**: Managed through Drizzle Kit

## Key Components

### User Management
- Multi-role system: clients, providers, and admins
- JWT-based authentication with secure token storage
- Password hashing with bcrypt
- User profile management with location data

### Service System
- Service categories with icons and descriptions
- Provider-service relationships with pricing
- Service requests with status tracking
- Review and rating system

### Geographic Features
- Location-based provider search
- CEP (postal code) integration
- Distance calculation for service matching
- Service radius configuration for providers

### Dashboard System
- Role-specific dashboards (client, provider, admin)
- Real-time data updates with TanStack Query
- Responsive design for mobile and desktop

## Data Flow

### Authentication Flow
1. User registers/logs in through frontend forms
2. Backend validates credentials and generates JWT token
3. Token stored in localStorage and used for API authentication
4. Auth context manages user state across the application

### Service Request Flow
1. Client searches for services by category and location
2. System queries providers within service radius
3. Client creates service request with details
4. Providers receive notifications and can accept requests
5. Status updates tracked through completion

### Provider Management
1. Providers register and await admin approval
2. Admin dashboard manages provider status
3. Providers configure services, pricing, and availability
4. Rating system tracks provider performance

## External Dependencies

### UI Components
- Radix UI for accessible component primitives
- Lucide React for consistent iconography
- React Hook Form with Zod validation
- Date-fns for date manipulation

### Backend Services
- Neon Database for PostgreSQL hosting
- WebSocket support for real-time features
- Express middleware for security and CORS

### Development Tools
- Vite with React plugin for fast development
- TypeScript for type safety
- Tailwind CSS for utility-first styling
- Drizzle Kit for database migrations

## Deployment Strategy

### Build Process
- Frontend: Vite builds optimized static assets
- Backend: ESBuild bundles server code for production
- Database: Drizzle pushes schema changes to production

### Environment Configuration
- Database URL required for PostgreSQL connection
- JWT secret for token signing
- Development vs production environment handling

### File Structure
- `client/` - Frontend React application
- `server/` - Backend Express application
- `shared/` - Shared TypeScript types and schemas
- `migrations/` - Database migration files

The application follows a monorepo structure with clear separation between frontend, backend, and shared code, enabling efficient development and deployment workflows.