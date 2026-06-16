# Knotx

Knotx is a full-stack learning platform built for DGCA students to prepare for aviation examinations through structured courses, video lectures, test series, practice papers, and subscription-based access.

The platform combines secure authentication, payment processing, adaptive video streaming, and exam-focused learning workflows into a single ecosystem.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-5.0-lightgrey?logo=express)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19.0-blue?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green?logo=mongodb)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-orange)
![FFmpeg](https://img.shields.io/badge/FFmpeg-Streaming-red)

---

## Features

### Learning & Assessment

* DGCA-focused test series and practice papers
* Course → Section → Lecture learning structure
* Video lecture delivery with HLS streaming
* Subscription-based content access
* Promocodes and discount management

### Authentication & Security

* JWT access and refresh token authentication
* Protected content access
* Request rate limiting
* Helmet security middleware
* CORS protection

### Payments

* Razorpay order creation
* Payment verification
* Webhook handling
* Subscription activation workflows

### Media Infrastructure

* Cloudinary-powered thumbnail storage
* FFmpeg-powered video processing
* HLS (.m3u8 + .ts) streaming pipeline
* Cloudflare R2 video storage
* Signed playback URL generation

---

## Architecture

### Backend

* Node.js
* Express 5
* MongoDB + Mongoose
* Razorpay
* Cloudinary
* Cloudflare R2
* FFmpeg

### Frontend

* Next.js 15
* React 19
* Tailwind CSS
* Styled Components
* Framer Motion
* React Hook Form

---

## Video Streaming Pipeline

Knotx does not serve raw MP4 files directly.

Instead, videos are processed through an adaptive HLS-based streaming pipeline:

```text
Admin Upload
      ↓
MP4 Upload
      ↓
FFmpeg Processing
      ↓
HLS Conversion
(.m3u8 + .ts chunks)
      ↓
Cloudflare R2 Storage
      ↓
Protected Playback Endpoint
      ↓
JWT Validation
      ↓
Signed Playback URL
      ↓
HLS Player
```

### Why HLS?

* Faster playback startup
* Better streaming performance
* Reduced buffering
* More difficult to download than direct MP4 links
* Industry-standard streaming format

### Video Security

The platform implements:

* JWT-protected lecture access
* Subscription validation before playback
* Signed playback URLs
* Private media storage architecture
* Server-side authorization layer

---

## Repository Structure

```text
Knotx
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── temp/
│
├── frontend/
│
└── README.md
```

---

## Core Models

### Course

Represents a DGCA course and contains:

* Title
* Description
* Thumbnail
* Sections
* Lectures
* Pricing
* Publication state

### Section

Groups lectures inside a course.

### Lecture

Stores:

* Title
* Description
* Video key
* Thumbnail
* Course reference
* Duration
* Order
* Preview permissions

---

## Development Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:8000
```

---

## Production Build

### Frontend

```bash
cd frontend
npm run build
npm run start
```

### Backend

```bash
cd backend
npm install --production
node -r dotenv/config src/index.js
```

---

## Future Roadmap

* Adaptive multi-bitrate streaming
* Watermarked video playback
* Course completion tracking
* Watch progress synchronization
* Device/session limits
* Analytics dashboard
* AI-powered study assistance
* Offline content support

---

## Resume Highlights

Key engineering components implemented:

* HLS-based video streaming infrastructure
* Cloudflare R2 media storage pipeline
* FFmpeg video processing workflows
* JWT-protected playback architecture
* Razorpay subscription system
* Full-stack Next.js + Express application

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Implement changes
4. Submit a pull request

---

## License

Distributed under the MIT License.
