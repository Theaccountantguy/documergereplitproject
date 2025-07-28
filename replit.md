# Mail Merge Pro - Google Docs & Sheets Integration

## Overview

This is a full-stack web application that enables users to create powerful mail merge operations using Google Docs as templates and Google Sheets as data sources. The application features a split-screen interface with document preview (80%) and settings panel (20%), secure OAuth integration with Google services, and batch PDF generation capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom design tokens and Google-inspired color palette
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **Authentication**: Supabase Auth with Google OAuth provider

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ES modules
- **API Structure**: RESTful API with structured route handlers
- **Development**: Hot module replacement with Vite middleware integration
- **Storage**: In-memory storage with interface for future database migration

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Four main tables (users, google_credentials, documents, merge_jobs)
- **Authentication Tokens**: Secure storage of Google access and refresh tokens
- **Migration System**: Drizzle Kit for schema migrations

## Key Components

### Authentication System
- **Provider**: Supabase with Google OAuth integration
- **Scopes**: Google Drive file access, Documents API, and Sheets API
- **Token Management**: Automatic refresh token handling to prevent re-authentication
- **Security**: Secure credential storage with environment variable configuration

### Google API Integration
- **Services**: Google Drive API, Documents API, Sheets API, and Picker API
- **Authentication**: OAuth 2.0 with appropriate scopes for file access
- **File Selection**: Google Picker API for intuitive file selection experience
- **Batch Operations**: Support for processing multiple records with progress tracking

### User Interface
- **Layout**: 80/20 split layout (document preview / settings panel)
- **Document Preview**: Live Google Docs content display with merge field highlighting
- **Settings Panel**: Collapsible sections for setup and properties configuration
- **Progress Tracking**: Real-time progress indication during merge operations

### Mail Merge Engine
- **Template Processing**: Google Docs template parsing with merge field detection
- **Data Source**: Google Sheets integration with header row extraction
- **Output Generation**: Batch PDF export using Google Drive API
- **Job Management**: Asynchronous processing with status tracking

## Data Flow

1. **User Authentication**: Users sign in via Supabase Google OAuth with required Google API scopes
2. **Credential Storage**: Google access and refresh tokens are securely stored in the database
3. **File Selection**: Users select Google Docs templates and Sheets data sources via Google Picker
4. **Template Processing**: Application parses the document template and extracts merge fields
5. **Data Mapping**: Sheet headers are displayed for field mapping configuration
6. **Merge Execution**: Supabase Edge Functions process the merge operation asynchronously
7. **PDF Generation**: Individual PDFs are generated and made available for download

## External Dependencies

### Google Cloud Services
- **Google Drive API**: File access and manipulation
- **Google Docs API**: Document content retrieval and processing
- **Google Sheets API**: Spreadsheet data access
- **Google Picker API**: File selection interface

### Third-party Services
- **Supabase**: Authentication, database, and edge functions
- **Neon Database**: PostgreSQL hosting (configured in Drizzle)

### Development Tools
- **Replit Integration**: Development environment optimization with error handling
- **ESBuild**: Production bundling for server code
- **PostCSS**: CSS processing with Tailwind CSS

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express API integration
- **Hot Reloading**: Full-stack hot module replacement
- **Environment Variables**: Local configuration for API keys and database connections

### Production Build
- **Frontend**: Vite production build with optimized asset bundling
- **Backend**: ESBuild bundling for Node.js deployment
- **Database**: Drizzle migrations for schema deployment
- **Edge Functions**: Supabase deployment for mail merge processing

### Configuration Requirements
- Google Cloud Console project with enabled APIs (Drive, Docs, Sheets, Picker)
- Supabase project with Google OAuth provider configured
- Environment variables: DATABASE_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- Google API credentials: VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_API_KEY, VITE_GOOGLE_APP_ID
- PostgreSQL database with proper connection string

### Recent Changes (January 28, 2025)
- **Simplified Authentication Flow**: Removed manual credential entry requirements
- **Pre-configured Google API Integration**: Uses environment variables for all Google credentials
- **Streamlined User Experience**: Users only need to authenticate via Google OAuth
- **Direct Google Picker Access**: No additional setup required for file selection
- **Minimal OAuth Permissions**: Reduced to drive.file scope for file-specific access only
- **Auth Callback Route**: Added /auth/callback for proper OAuth redirect handling

The application is designed to be deployed on platforms that support Node.js with the ability to serve static files and handle environment variables securely.