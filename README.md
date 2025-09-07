<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/benmwilson/keepsakes">
    <img src="public/favicon.png" alt="Logo" width="120" height="120">
  </a>

  <h1 align="center">Keepsakes</h1>

  <p align="center">
    A modern, interactive memory wall app for sharing photos, stories, and keepsakes at family events.
  </p>
</p>

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
        <li><a href="#features">Features</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#docker-deployment">Docker Deployment</a></li>
      </ul>
    </li>
    <li>
      <a href="#development">Development</a>
      <ul>
        <li><a href="#local-development">Local Development</a></li>
        <li><a href="#database-setup">Database Setup</a></li>
      </ul>
    </li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

# About The Project

Keepsakes is an interactive memory wall app designed to create a shared space where family and friends can share photos, stories, and digital keepsakes during special events. Originally built as a birthday gift, this version features modern architecture, performance optimizations, and easy deployment practices.

The app provides a seamless experience where guests can:
- **Upload photos and videos** directly from their mobile devices
- **Share text messages** and heartfelt notes
- **View all keepsakes** in a beautiful, real-time carousel
- **Access admin controls** for event management
- **Download memories** for personal keepsakes

### Built With

- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - Beautiful, accessible UI components
- [PostgreSQL](https://www.postgresql.org/) - Robust relational database
- [Docker](https://www.docker.com/) - Containerized deployment
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Lucide React](https://lucide.dev/) - Beautiful icons

### Features

- 🖼️ **Interactive Memory Wall** - Beautiful grid display of all shared memories
- 📱 **Mobile-First Design** - Optimized for mobile devices and tablets
- 🎠 **Carousel Functionality** - Smooth browsing through keepsakes
- ⚡ **Real-time Updates** - Live updates when new content is added
- 🔐 **Admin Dashboard** - Event management and content moderation
- 📁 **File Upload** - Support for photos, videos, and text
- 🎨 **Customizable Events** - Multiple event support with custom settings
- 🐳 **Docker Ready** - Easy deployment with Docker Compose

<!-- GETTING STARTED -->

# Getting Started

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL (for local development)

## Installation

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository**
   ```sh
   git clone https://github.com/benmwilson/keepsakes.git
   cd keepsakes
   ```

2. **Set up environment variables**
   ```sh
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**
   ```sh
   docker-compose up -d
   ```

4. **Access the application**
   Navigate to `http://localhost:3000`

### Option 2: Local Development

1. **Clone and install**
   ```sh
   git clone https://github.com/benmwilson/keepsakes.git
   cd keepsakes
   npm install
   ```

2. **Set up PostgreSQL database**
   ```sh
   # Create database and run migrations
   psql -U postgres -c "CREATE DATABASE keepsakes_db;"
   psql -U postgres -d keepsakes_db -f init.sql
   ```

3. **Configure environment**
   ```sh
   cp env.example .env
   # Edit .env with your database credentials
   ```

4. **Start development server**
   ```sh
   npm run dev
   ```

## Docker Deployment

The application includes complete Docker configuration for easy deployment:

```sh
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The Docker setup includes:
- **App container** - Next.js application
- **PostgreSQL container** - Database with automatic initialization
- **Volume persistence** - Data persistence across container restarts

# Development

## Local Development

1. **Prerequisites**
   - Node.js 18+ and npm
   - PostgreSQL database

2. **Setup**
   ```sh
   git clone https://github.com/benmwilson/keepsakes.git
   cd keepsakes
   npm install
   cp env.example .env
   # Configure your .env file
   ```

3. **Database setup**
   ```sh
   # Create database
   createdb keepsakes_db
   
   # Run initialization script
   psql -d keepsakes_db -f init.sql
   ```

4. **Start development**
   ```sh
   npm run dev
   ```

5. **Access the application**
   - Navigate to `http://localhost:3000`
   - The app will use mock data until Postgres integration is complete

## Database Setup

The application uses PostgreSQL with the following schema:

- **events** - Event configuration and settings
- **keepsakes** - User-uploaded content (photos, videos, text)
- **guest_emails** - Guest registration and consent tracking

See `init.sql` for the complete database schema.


<!-- LICENSE -->

# License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.


---

**Made with ❤️ by [Ben Wilson](https://benmwilson.dev)**
