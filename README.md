# Thrift Store
**Full Stack Web Application — README & Documentation**

---

## Overview

Thrift Store is a feature-rich full-stack marketplace where users can buy and sell second-hand goods, event tickets, and merchandise. It supports three listing types: **Auctions** (time-limited bidding), **Merchandise** (fixed-price with size inventory), and **Events** (comedy shows, concerts, and general events with ticket tiers).

The platform provides real-time chat between buyers and sellers, wishlist notifications, email ticket delivery, OTP-based user verification, and a full admin dashboard.

---

## Features

### Buyer Features
- Browse items by category, subcategory, and nested subcategory
- Real-time auction bidding with automatic auction closure every 60 seconds
- Purchase merchandise by size and quantity
- Buy event/concert tickets with tier-based pricing
- Wishlist subscriptions with email notifications for new matching listings
- Real-time chat with sellers via Socket.IO
- Ticket delivery via styled email

### Seller Features
- Post ads for auctions, merchandise, and events
- Seller dashboard with listing management and bid tracking
- Upload multiple product images via Cloudinary

### Admin Features
- Admin verification portal for new user accounts
- Report management system (review, resolve, dismiss)
- Notification broadcasting to users

### Authentication & Security
- JWT-based authentication with MongoDB session management
- OTP email verification on registration
- Bcrypt password hashing
- Role-based access control (user / admin)

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| React Router DOM 7 | Client-side routing |
| Socket.IO Client 4 | Real-time communication |
| CSS Modules | Component styling |
| Nodemailer (client proxy) | Email delivery integration |

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose 9 | Database and ODM |
| Socket.IO 4 | WebSocket server |
| Cloudinary | Image upload and CDN storage |
| JWT + express-session | Authentication tokens |
| Bcrypt | Password hashing |
| Nodemailer | OTP, tickets, wishlist emails |
| Multer | File upload middleware |
| connect-mongo | MongoDB session store |

---

## Project Structure

```
Thrift-store-main/
├── api/
│   └── send-email.js               # Vercel serverless email proxy
├── backend/
│   ├── config/
│   │   ├── db.js                   # MongoDB connection
│   │   └── cloudinary.js           # Cloudinary config
│   ├── controllers/                # Route handler logic
│   │   ├── authController.js       # Register, login, OTP
│   │   ├── itemController.js       # Item CRUD
│   │   ├── auctionController.js
│   │   ├── bidController.js
│   │   ├── chatController.js
│   │   ├── purchaseController.js
│   │   ├── reportController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT / session guard
│   ├── models/                     # Mongoose schemas
│   │   ├── User.js
│   │   ├── Item.js
│   │   ├── Auction.js
│   │   ├── Bid.js
│   │   ├── ChatRoom.js
│   │   ├── ChatMessage.js
│   │   ├── Purchase.js
│   │   ├── Notification.js
│   │   └── Report.js
│   ├── routes/                     # Express routers
│   ├── services/
│   │   ├── auctionLifecycle.js     # Auto-close expired auctions
│   │   └── wishlistNotifications.js
│   ├── socket/
│   │   └── chatSocket.js           # Socket.IO event handlers
│   ├── utils/
│   │   ├── email.js
│   │   ├── sendTicketEmail.js
│   │   └── socket.js
│   └── server.js                   # App entry point
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js                  # Route definitions
        ├── Home.jsx
        ├── NavBar.jsx
        ├── RegisterPage.jsx
        ├── ItemDetail.jsx
        ├── AuctionDetail.jsx
        ├── Merchandise.jsx
        ├── PostAdView.jsx
        ├── UploadItem.jsx
        ├── ChatPage.jsx
        ├── Profile.jsx
        ├── Wishlist.jsx
        ├── MyTickets.jsx
        ├── SellerDashboard.jsx
        ├── AdminVerification.jsx
        ├── CategoryList.jsx
        ├── SubcategoryList.jsx
        └── NestedSubcategoryList.jsx
```

---

## Getting Started

### Prerequisites
- Node.js v18 or higher
- npm v9 or higher
- Running MongoDB instance (local or MongoDB Atlas)
- Cloudinary account (free tier works)
- Gmail account with App Password for Nodemailer

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/thrift-store.git
cd thrift-store
```

### 2. Set Up the Backend

```bash
cd backend
npm install

# Development (auto-restart)
npm run dev

# Production
npm start
```

Create a `.env` file in the `backend/` directory. See the [Environment Variables](#environment-variables) section below.

### 3. Set Up the Frontend

```bash
cd frontend
npm install
npm start
```

The React dev server starts on `http://localhost:3000` and proxies API calls to the backend URL set in `frontend/package.json`.

---

## Environment Variables

Create a `.env` file inside `backend/` with the following keys:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/thriftstore

# Session
SESSION_SECRET=your-session-secret-here

# JWT
JWT_SECRET=your-jwt-secret-here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Thrift Store

# Serverless email proxy API key
EMAIL_API_KEY=your-internal-api-key
```

> **Tip:** For Gmail, generate an App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) instead of using your main password.

---

## API Reference

All routes are prefixed with `/api`.

### Authentication — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/verify-otp` | Verify OTP sent to email |
| POST | `/login` | Log in, receive session/JWT |
| POST | `/logout` | Destroy session |
| GET | `/me` | Get current user profile |

### Items — `/api/items`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all items (with filters) |
| GET | `/:id` | Get single item |
| POST | `/` | Create listing (auth required) |
| PUT | `/:id` | Update listing |
| DELETE | `/:id` | Delete listing |

### Auctions — `/api/auctions`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all auctions |
| GET | `/:id` | Get auction details |
| POST | `/` | Create auction |
| PATCH | `/:id/close` | Manually close an auction |

### Bids — `/api/bids`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Place a bid |
| GET | `/auction/:auctionId` | Get bids for an auction |

### Users — `/api/users`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List users (admin) |
| PUT | `/:id` | Update user profile |
| GET | `/:id/wishlist` | Get wishlist subscriptions |
| POST | `/:id/wishlist` | Add wishlist subscription |

### Chat — `/api/chats`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/rooms` | Get user's chat rooms |
| POST | `/rooms` | Create or get a chat room |
| GET | `/rooms/:roomId/messages` | Get messages in a room |

### Purchases — `/api/purchases`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Purchase merchandise or ticket |
| GET | `/my` | Get current user's purchases |

### Notifications — `/api/notifications`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get notifications for current user |
| PATCH | `/:id/read` | Mark notification as read |

### Reports — `/api/reports`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Submit a report |
| GET | `/` | List all reports (admin) |
| PATCH | `/:id` | Update report status (admin) |

---

## Database Models

### User
`name`, `email`, `password` (bcrypt), `role` (user|admin), `isVerified`, `otpCode`, `otpExpiresAt`, `wishlistSubscriptions[]`

### Item
`title`, `description`, `category`, `listingType` (auction|merchandise|comedy|event|concert), `subcategory`, `nestedSubcategory`, `image`, `images[]`, `askingPrice`, `biddingDuration`, `seller`, `status` (available|sold|ended), `sizeInventory[]`, `ticketTiers[]`

### Auction
`item`, `startingPrice`, `currentPrice`, `highestBidder`, `endsAt`, `status` (active|closed)

### Bid
`auction`, `bidder`, `amount`, `createdAt`

### ChatRoom
`participants[]`, `item`, `lastMessage`, `updatedAt`

### ChatMessage
`room`, `sender`, `text`, `createdAt`

### Purchase
`buyer`, `item`, `quantity`, `size`, `totalPrice`, `ticketTier`, `createdAt`

### Notification
`recipient`, `type`, `message`, `item`, `read`, `createdAt`

### Report
`reporter`, `item`, `reason`, `details`, `status`, `createdAt`

---

## Real-Time Features (Socket.IO)

### Chat Events

| Event | Direction | Description |
|---|---|---|
| `join_room` | Client → Server | Join a chat room |
| `send_message` | Client → Server | Send a chat message |
| `receive_message` | Server → Client | Receive a new message |
| `leave_room` | Client → Server | Leave a chat room |

### Auction Events

Bid placements and auction closures are broadcast to all clients subscribed to a specific auction room. The server runs a `setInterval` check every 60 seconds to automatically close auctions whose `endsAt` timestamp has passed.

---

## Deployment

### Backend — Render
- **Build command:** `npm install`
- **Start command:** `node server.js`
- Add all environment variables in the Render dashboard
- Live backend: https://thrift-store-5u43.onrender.com

### Frontend — Vercel
- The `api/send-email.js` file is deployed as a Vercel serverless function
- Set proxy in `frontend/package.json` to your Render backend URL for local dev
- Live frontend: https://thrift-store-ruby.vercel.app

---

Licensed under the **MIT License**. Built with React, Node.js, MongoDB, and Socket.IO.
