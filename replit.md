# BaazCine - Reservation System

## Project Overview
A military-themed cinema reservation system providing a comprehensive, user-friendly platform for movie screenings and precise seat allocation. Previously known as "Shahbaaz Auditorium", the system has been rebranded to "BaazCine" to better reflect its cinema focus.

## Recent Changes
- **2025-01-28**: Scalable Filter System Implementation
  - Replaced dropdown filters with searchable command palettes for shows and users
  - Implemented lazy loading: shows limited to 50 recent items, users to 50 alphabetical
  - Added real-time search functionality within filters to find specific items
  - Enhanced performance for large datasets with pagination and search limits
  - Maintained "All Shows" and "All Users" options while preventing performance issues
- **2025-01-28**: Comprehensive Admin Dashboard Redesign
  - Complete reservation management overhaul with advanced filtering and search
  - Enhanced user management with proper pagination and dark mode support
  - Improved show management with list-based layout and comprehensive details dialog
  - Professional styling with consistent hover effects and responsive design
- **2025-01-10**: Admin Interface Enhancements
  - Fixed database parameter mismatch error preventing app startup
  - Fixed JSON parsing error for allowedCategories field in edit dialog
  - Fixed FAFA exclusive rows input to allow natural comma typing and auto-convert to uppercase
  - Added missing form fields to EditShowDialog (price, food menu, categories, FAFA rows)
  - Made edit dialog scrollable to prevent content clipping
  - Added comprehensive show details view with statistics and reservation overview
  - Implemented share functionality for booking links with one-click copying
  - Enhanced admin interface with View Details, Share, Edit, and Delete actions
- **2025-01-10**: User Category System Implementation
  - Added user categories: single, family, FAFA
  - Added show-level category restrictions (allowedCategories)
  - Added FAFA-exclusive row functionality (fafaExclusiveRows)
  - Updated database schema with new fields
  - Fixed plastic seat number visibility when selected
- **2025-01-10**: Plastic Seats Enhancements
  - Fixed seat numbering display to show 1-18 correctly
  - Updated seat validation to support plastic seat format (R11, R21, etc.)
  - Enhanced selected seat visibility with better styling
  - Successfully implemented plastic seat reservations
- **2025-01-02**: Complete rebranding from "Shahbaaz Auditorium" to "BaazCine"
  - Updated all UI text, translations, and documentation
  - Changed terminology from auditorium/events to cinema/movies
  - Modified footer to use column layout with centered content
  - Added "About / Contact" link in footer to clearly indicate contact info location
  - Simplified footer by removing quick navigation links except About
  - Moved contact information from footer to About page
- **2025-01-02**: Scripts folder cleanup and organization
  - Removed obsolete PostgreSQL-focused scripts
  - Removed one-time migration scripts no longer needed
  - Created scripts/README.md for documentation
  - Streamlined to essential scripts only
- **2025-01-02**: Added plastic seats section
  - Updated schema with new "Plastic" section containing 3 rows (R1, R2, R3)
  - Added 54 plastic seats with same layout as Front section (18 seats per row)
  - Implemented distinctive purple styling for plastic seats
  - Added "PLASTIC SEATS SECTION" header and visual indicators

## Project Architecture
- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js with SQLite database
- **Database**: Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with session-based auth
- **Deployment**: VPS deployment with PM2 process management

## Key Features
- User management with admin privileges
- Movie/screening management with pricing
- Seat reservation and blocking system
- Multi-language support (English and Hindi)
- Responsive design for all devices
- Role-based access control

## User Preferences
- Simplified, minimal footer design
- Contact information centralized in About page
- Clear labeling for navigation elements