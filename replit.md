# Qserviços - Service Provider Platform

## Overview

Qserviços is a full-stack service provider platform that connects clients with service providers across various categories (plumbing, cleaning, driving, etc.). The application features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data storage and Drizzle ORM for database operations.

## User Preferences

Preferred communication style: Simple, everyday language.

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