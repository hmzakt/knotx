# Knotx

Knotx is a learning platform for DGCA students to prepare for exams by offering test-series and practice papers. This repository contains a Node.js + Express backend and a Next.js + React frontend. The app supports user authentication, payments (Razorpay), rate limiting and scheduled jobs for expiry handling.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-5.0-lightgrey?logo=express)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19.0-blue?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green?logo=mongodb)

## Features
- Sign up / login with JWT access/refresh tokens
- Create / attempt practice papers and test series
- Promocodes and subscriptions
- Payment flow with Razorpay (order creation, webhook handling)
- Cloudinary-backed image uploads for content
- Rate limiting and basic request security (helmet, cors)

## Repository structure

- backend/: Express API server (Node.js, Mongoose)
- src/: application source files (controllers, models, routes, middlewares, utils)
- frontend/: Next.js application (React 19)

## Technologies

### Backend

- Node.js (v18+ recommended)
- Express 5
- MongoDB (Mongoose)
- Razorpay SDK
- rate limiting (express-rate-limit), helmet, cors, compression, cron


Scripts (backend)

- start: node -r dotenv/config src/index.js
- dev: nodemon -r dotenv/config --experimental-json-modules src/index.js

### Frontend

- Next.js 15 (React 19)
- Tailwind CSS (v4 configuration present)
- Styled Components
- Framer Motion (animations)
- react-hook-form for forms

Scripts (frontend)

- dev: next dev
- build: next build
- start: next start
- lint: next lin


Backend (PowerShell commands)

```powershell
cd backend
cp .env.example .env  # if you have an example; otherwise create .env manually
npm install
npm run dev
```

Frontend (PowerShell commands)

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs on http://localhost:3000 by default, and the backend on http://localhost:4000 unless `PORT` is set.

## Production / build notes

Build frontend for production:

```powershell
cd frontend
npm run build
npm run start
```

Start backend in production (make sure env vars are set):

```powershell
cd backend
npm install --production
node -r dotenv/config src/index.js
```


## Testing

There are no automated tests in the repository by default. You can add unit and integration tests for backend controllers and frontend components in future iterations.

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repository
2. Create a feature branch
3. Run the app locally and add tests
4. Submit a pull request with a clear description of changes

Follow existing code style: backend uses ES modules and modern JS. Frontend uses Next.js with TypeScript configuration present (some files may be .js), styled-components and Tailwind.

