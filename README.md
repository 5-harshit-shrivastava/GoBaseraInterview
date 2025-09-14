# GoBasera Interview Project 🚀

A full-stack announcement system with toggle-based reactions and comments functionality.

## 🏗️ Architecture

### **Backend** (NestJS + TypeScript)
- **Framework**: NestJS with Express
- **Language**: TypeScript
- **Storage**: In-memory (for demo purposes)
- **Deployment**: Render.com
- **Port**: 4000

### **Frontend** (React + TypeScript + Vite)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Modules
- **Deployment**: Vercel
- **Port**: 5174 (dev)

## 🔥 Key Features

### **Toggle-Based Reaction System**
- **Pointer Logic**: Each user has one "pointer" that can point to heart ❤️, up 👍, down 👎, or nothing
- **Toggle Behavior**:
  - Click to turn on → Click again to turn off → Click different to switch
  - Visual feedback with clear on/off states
- **Real-time Totals**: Shows aggregate counts (e.g., "👍 5 Likes, ❤️ 3 Hearts")

### **Advanced Comments System**
- **Pagination**: Cursor-based pagination with "Load More" functionality
- **Rate Limiting**: 10 comments per minute per IP address
- **Delete Comments**: Users can delete their own comments
- **Validation**: Input sanitization and error handling

### **Performance Features**
- **ETag Caching**: Efficient caching for announcements list
- **Throttling**: API rate limiting with NestJS Throttler
- **Optimized Counting**: Set-based unique user tracking for reactions

## 🛠️ API Endpoints

### **Core Announcements**
```
POST   /announcements              # Create announcement
GET    /announcements              # Get all with ETag caching
PATCH  /announcements/:id          # Update announcement
```

### **Comments System**
```
POST   /announcements/:id/comments           # Add comment (rate limited)
GET    /announcements/:id/comments           # Get comments (paginated)
DELETE /announcements/:id/comments/:commentId # Delete own comment
```

### **Reactions System**
```
POST   /announcements/:id/reactions    # Toggle reaction (heart/up/down)
DELETE /announcements/:id/reactions    # Remove reaction
GET    /announcements/:id/user-reaction # Get user's current reaction
```

## 🔒 Security & Validation

- **Rate Limiting**: 10 comments per minute per IP
- **User Authorization**: Required `x-user-id` header
- **Input Validation**: class-validator with DTOs
- **Error Handling**: Global exception filters
- **CORS**: Configured for development and production

## 📦 Tech Stack

### **Backend Dependencies**
- `@nestjs/core` - NestJS framework
- `@nestjs/throttler` - Rate limiting
- `class-validator` - Input validation
- `uuid` - Unique ID generation
- `typescript` - Type safety

### **Frontend Dependencies**
- `react` - UI library
- `axios` - HTTP client
- `typescript` - Type safety
- `vite` - Build tool

## 🚀 Deployment

### **Backend** (Render)
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`
- Environment: Node.js 18
- Auto-deploy from GitHub

### **Frontend** (Vercel)
- Build Command: `npm run build`
- Framework Detection: Vite
- Auto-deploy from GitHub

## 💻 Development Setup

### **Prerequisites**
- Node.js 18+
- npm or yarn

### **Backend Setup**
```bash
cd backend
npm install
npm run start:dev    # Runs on http://localhost:4000
```

### **Frontend Setup**
```bash
cd frontend
npm install
npm run dev         # Runs on http://localhost:5174
```

## 🎯 Features Implemented

### **Toggle Reaction System**
- ✅ Pointer-based reaction logic
- ✅ Visual toggle states (on/off)
- ✅ Real-time aggregate totals
- ✅ Three reaction types (heart, up, down)

### **Comments System**
- ✅ Add/delete comments
- ✅ Cursor-based pagination
- ✅ Rate limiting (10/minute)
- ✅ User-specific operations

### **Performance & Security**
- ✅ ETag caching
- ✅ API throttling
- ✅ Input validation
- ✅ Error handling
- ✅ CORS configuration

### **UI/UX**
- ✅ Responsive design
- ✅ Loading states
- ✅ Error feedback
- ✅ Intuitive toggle interactions

## 🔄 Data Flow

1. **User clicks reaction** → Frontend sends toggle request
2. **Backend processes** → Updates user's pointer position
3. **Counts updated** → Recalculates totals using Set logic
4. **UI refreshes** → Shows new state and totals

## 📈 Performance Optimizations

- **Set-based counting**: O(1) add/remove operations
- **Cursor pagination**: Efficient large dataset handling
- **ETag caching**: Reduces unnecessary data transfer
- **Rate limiting**: Prevents abuse and spam

## 🎨 UI Components

### **Reactions Component**
- Toggle buttons with visual states
- Real-time count updates
- Smooth animations and feedback

### **Comments Component**
- Paginated comment list
- Add/delete functionality
- Load more with cursor tracking

## 🔧 Configuration

### **Environment Variables**
- `VITE_API_URL`: Backend API URL
- `PORT`: Server port (default: 4000)

### **CORS Origins**
- `http://localhost:5173` (dev)
- `http://localhost:5174` (dev)
- Vercel domains (production)
- Render domains (production)

## 📝 Commit History

- **commit-1**: Initial setup
- **commit-2**: Basic structure
- **commit-3**: Core functionality
- **commit-4**: Toggle reaction system + comments
- **commit-5**: ES Module compatibility fix
- **commit-6**: Complete documentation

---

**Built with ❤️ for GoBasera Interview Process**