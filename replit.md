# Qserviços - Service Marketplace Platform

## Overview
Qserviços is a comprehensive service marketplace platform designed to connect service providers with clients. It offers a user-friendly, intelligent, and secure ecosystem for service discovery, booking, and payment. Key capabilities include geolocation services for proximity-based searches, integrated payment solutions (Stripe, MercadoPago), and real-time communication features. The project aims to provide a seamless experience for both service providers and clients, facilitating efficient service transactions.

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
- **Mobile Integration**: A separate mobile-first client (`/mobile-app/`) is integrated, consuming existing APIs and designed with a Flutter-inspired interface for a native-like experience.

## External Dependencies
- **Mapping & Geolocation**: OpenStreetMap (for map services and reverse geocoding)
- **Payment Gateways**: Stripe, MercadoPago (for processing payments, including PIX)
- **Database**: PostgreSQL
- **File Uploads**: `multer` (Node.js middleware for handling multipart/form-data)
- **Charting**: Recharts (for data visualization in admin reports)
- **UI Components**: shadcn/ui