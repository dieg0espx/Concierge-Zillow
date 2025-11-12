# Property Manager System

A Next.js application for managing properties with property manager assignments and analytics.

## Features

- Property listing and management
- Property manager profiles and portfolios
- Public portfolio pages for property managers
- Admin dashboard for managing properties and managers
- Analytics and charts
- Authentication with Supabase

## Tech Stack

- **Framework**: Next.js 14
- **UI**: React, Tailwind CSS, Radix UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run database migrations:
```bash
npm run db:migrate
```

3. (Optional) Seed property managers:
```bash
npm run db:seed
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment

This project is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your environment variables in Vercel project settings
4. Deploy

## Project Structure

```
/app              - Next.js app router pages
/components       - Reusable React components
/lib              - Utility functions and configurations
/hooks            - Custom React hooks
/public           - Static assets
/scripts          - Database scripts
/supabase         - Supabase migrations
```

## License

Private project
