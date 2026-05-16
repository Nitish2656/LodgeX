# LodgeX - Lodge Rental Management System

LodgeX is a premium, high-performance web application designed for lodge and rental property owners to streamline their management workflows. Built with a modern tech stack, it provides a seamless experience for tracking tenants, rooms, payments, and operational reports.

![LodgeX Dashboard](public/404-bg.png) *<!-- Add a proper screenshot if available -->*

## 🚀 Key Features

- **Dynamic Dashboard**: Real-time visualization of occupancy rates, pending dues, and monthly revenue using Recharts.
- **Tenant Management**: Comprehensive records for occupants including contact details, Aadhaar/ID verification, and payment history.
- **Room Inventory**: Easily manage room assignments, availability, and maintenance statuses.
- **Automated Billing**: Track monthly rent, security deposits, and outstanding balances automatically.
- **Mobile-First Design**: A fully responsive interface featuring gesture-friendly navigation and a premium bottom bar for mobile users.
- **Secure Authentication**: Admin-only access protected by JWT-based authentication and secure password hashing.
- **Rich UI/UX**: Crafted with Tailwind CSS 4.0, Framer Motion for smooth transitions, and Lucide icons for a premium feel.

## 🛠️ Tech Stack

**Frontend:**
- **React 19**: Modern component-based architecture.
- **Tailwind CSS 4.0**: Utility-first styling with the latest features.
- **Framer Motion**: Smooth micro-animations and page transitions.
- **Recharts**: Interactive data visualization.
- **Lucide React**: Beautiful, consistent iconography.
- **Vite**: Ultra-fast build tool and development server.

**Backend:**
- **Node.js & Express**: Robust and scalable server environment.
- **MongoDB & Mongoose**: Flexible NoSQL database for data persistence.
- **JWT & BcryptJS**: Secure authentication and data protection.
- **Multer**: Handling file uploads for tenant documentation.

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/Nitish2656/LodgeX.git
cd LodgeX
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
# Create a .env file with:
# PORT=5000
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key

# Start backend server
npm run dev
```

## 📱 Mobile Experience
LodgeX is optimized for mobile devices with:
- **Bottom Navigation**: Quick access to primary modules.
- **Responsive Grids**: Layouts that adapt perfectly to any screen size.
- **Touch-Friendly Controls**: Layouts designed for natural thumb movement and gesture support.

## 📄 License
This project is private and intended for internal lodge management use.

---
Developed with ❤️ by [Nitish](https://github.com/Nitish2656)
