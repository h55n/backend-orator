# Orator — JavaScript / Vercel Implementation

This repository contains an earlier JavaScript implementation of **Orator**, an AI-powered interview-practice application. It includes a React/Vite frontend plus an Express-style serverless API for authentication, question generation, history, favorites, and session workflows.

> **Project status:** this is the older/alternate Vercel-oriented implementation. The current full-stack Orator project is maintained at https://github.com/h55n/orator and should be treated as the canonical portfolio version.

## Features

- Login and registration with JWT-based authentication
- Protected dashboard and interview-generation routes
- AI-generated interview questions through Groq
- Session history and favorites
- PostgreSQL persistence
- React Router application shell
- Vercel serverless API deployment

## Stack

- React 18 + Vite
- React Router
- Tailwind CSS
- Node.js / Express
- PostgreSQL (`pg`)
- JWT + bcrypt
- Groq SDK
- Vercel serverless functions

## Local setup

```bash
git clone https://github.com/h55n/backend-orator.git
cd backend-orator
npm install
cp .env.example .env
# Configure DATABASE_URL, JWT_SECRET, and GROQ_API_KEY in .env before continuing.
npm run db:init
npm run dev
```

The frontend development server is started by Vite. The `api/` directory contains the server/API implementation used by the Vercel deployment.

## Environment variables

Create `.env` from `.env.example` and provide:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=replace-with-a-long-random-secret
GROQ_API_KEY=gsk_...
```

Never commit real environment files or credentials.

## Repository structure

```text
backend-orator/
├── api/                 # Serverless API / backend routes
├── src/                 # React application
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   └── services/
├── public/
├── package.json
├── vite.config.js
└── vercel.json
```

Generated directories such as `node_modules/` and `dist/` are intentionally excluded from Git.

## Build

```bash
npm run build
npm test
```

## Canonical project

For the newer Java/Spring Boot + React implementation, architecture documentation, and current project presentation, use **[h55n/orator](https://github.com/h55n/orator)**.
