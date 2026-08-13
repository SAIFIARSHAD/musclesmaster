# MusclesMaster AI

Enterprise Fitness Management Platform — Multi-branch gym management system.

## Project Structure

musclesmaster/
├── apps/
│   ├── backend-api/              # Express + TypeScript REST API
│   └── super-admin-dashboard/    # React + Vite + TypeScript frontend
├── turbo.json
└── package.json

## Tech Stack

- **Backend**: Express, TypeScript, MongoDB Atlas (Mongoose), JWT
- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Monorepo**: Turborepo

## Setup

1. Clone the repo
2. Run `npm install` at root
3. Copy `.env.example` to `.env` in `apps/backend-api/` and fill values
4. Run `npm run dev`

## Development Status

Phase 1 — Core Gym Management Platform (In Progress)