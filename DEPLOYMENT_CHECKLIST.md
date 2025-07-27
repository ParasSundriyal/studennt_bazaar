# Campus Swapmeet - Deployment Checklist

## ✅ Backend API Issues Fixed

### 1. Package.json Updates
- ✅ Added `start` script for production deployment
- ✅ Added `dev` script with nodemon for development
- ✅ Added `nodemon` as dev dependency
- ✅ Added `engines` field specifying Node.js version requirement

### 2. Environment Variable Validation
- ✅ Added validation for required environment variables (`MONGODB_URI`, `JWT_SECRET`)
- ✅ Added graceful error handling with clear error messages
- ✅ Application will exit with proper error message if required vars are missing

### 3. Authentication Middleware Consistency
- ✅ Standardized all routes to use the centralized `auth` middleware
- ✅ Removed duplicate JWT verification code from individual routes
- ✅ Updated all routes to use `req.user._id` instead of `req.user.id`
- ✅ Fixed user object structure consistency across all routes

### 4. Route Updates
- ✅ **Auth Routes**: Updated to use consistent auth middleware
- ✅ **Products Routes**: Fixed middleware usage and user ID references
- ✅ **Users Routes**: Updated to use consistent auth middleware
- ✅ **Categories Routes**: Simplified and standardized
- ✅ **Favorites Routes**: Updated to use consistent auth middleware
- ✅ **Reports Routes**: Updated to use consistent auth middleware
- ✅ **Seller Routes**: Updated to use consistent auth middleware
- ✅ **Admin Routes**: Updated to use consistent auth middleware
- ✅ **Chat Routes**: Already using consistent auth middleware

### 5. Error Handling
- ✅ Added comprehensive error handling in all routes
- ✅ Consistent error response format across all endpoints
- ✅ Proper HTTP status codes for different error types

## ✅ Frontend Deployment Updates

### 1. Vercel Configuration
- ✅ Updated `vercel.json` to handle SPA routing properly
- ✅ Added CORS headers for API routes
- ✅ Removed unnecessary API route rewrites (handled by backend)

## 🔧 Required Environment Variables

### Backend (.env)
```env
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key-here

# Optional
FRONTEND_URL=https://your-frontend-domain.vercel.app
NODE_ENV=production
PORT=5000

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-domain.vercel.app
```

## 🚀 Deployment Steps

### Backend Deployment (Vercel)
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Frontend Deployment (Vercel)
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Set `VITE_API_URL` environment variable
4. Deploy

## 🔍 API Endpoints Summary

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)

### Products
- `GET /api/products` - Get all active products (public)
- `GET /api/products/all` - Get all active products (public)
- `GET /api/products/:id` - Get product by ID (public)
- `POST /api/products` - Create product (seller only)
- `PUT /api/products/:id` - Update product (seller only)
- `DELETE /api/products/:id` - Delete product (seller only)
- `GET /api/products/my` - Get user's products (protected)
- `POST /api/products/:id/buy-request` - Create buy request (protected)
- `GET /api/products/buy-requests/seller` - Get seller's buy requests (protected)
- `GET /api/products/buy-requests/buyer` - Get buyer's buy requests (protected)
- `POST /api/products/buy-requests/:id/approve` - Approve buy request (seller only)
- `POST /api/products/buy-requests/:id/reject` - Reject buy request (seller only)

### Chat
- `GET /api/chat/conversations` - Get user's conversations (protected)
- `POST /api/chat/conversations` - Create/find conversation (protected)
- `GET /api/chat/conversations/:id/messages` - Get conversation messages (protected)
- `POST /api/chat/conversations/:id/messages` - Send message (protected)
- `PUT /api/chat/conversations/:id/read` - Mark as read (protected)
- `DELETE /api/chat/messages/:id` - Delete message (protected)
- `GET /api/chat/unread-count` - Get unread count (protected)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/stats` - Get dashboard stats (superadmin only)
- `GET /api/users/dashboard-stats` - Get user stats (protected)
- `GET /api/users/:id` - Get user profile (protected)
- `PUT /api/users/me` - Update user profile (protected)
- `PUT /api/users/me/location` - Update user location (protected)

### Categories
- `GET /api/categories` - Get all categories (public)
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

### Favorites
- `GET /api/favorites` - Get user's favorites (protected)
- `POST /api/favorites` - Add to favorites (protected)
- `DELETE /api/favorites/:productId` - Remove from favorites (protected)

### Reports
- `GET /api/reports` - Get all reports (admin only)
- `POST /api/reports` - Create report (protected)
- `PUT /api/reports/:id/status` - Update report status (admin only)

### Seller Management
- `POST /api/seller/apply` - Apply for seller status (protected)
- `GET /api/seller/applications` - Get applications (admin only)
- `POST /api/seller/applications/:id/approve` - Approve application (admin only)
- `POST /api/seller/applications/:id/reject` - Reject application (admin only)

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/products` - Get all products (admin only)
- `GET /api/admin/reports` - Get all reports (admin only)

## 🔒 Security Features

### Authentication
- JWT-based authentication
- Token expiration (7 days)
- Protected routes with middleware
- Role-based access control

### CORS Configuration
- Configurable allowed origins
- Support for Vercel domains
- Local development support
- Credentials support

### Error Handling
- Comprehensive error responses
- No sensitive information in production errors
- Proper HTTP status codes
- Validation error handling

## 📱 Real-time Features

### Socket.IO Integration
- Real-time messaging
- Conversation updates
- Typing indicators
- Connection status management
- Authentication with JWT tokens

## 🎯 Testing Checklist

### Backend API Testing
- [ ] All endpoints return proper status codes
- [ ] Authentication works correctly
- [ ] Authorization (role-based access) works
- [ ] Error handling returns proper responses
- [ ] Database operations work correctly
- [ ] File uploads work (if using Cloudinary)
- [ ] Real-time messaging works

### Frontend Testing
- [ ] All pages load correctly
- [ ] Authentication flow works
- [ ] Chat functionality works
- [ ] Product listing and details work
- [ ] User dashboard works
- [ ] Admin features work (if applicable)
- [ ] Responsive design works on mobile

### Integration Testing
- [ ] Frontend can communicate with backend
- [ ] Real-time features work between users
- [ ] File uploads work end-to-end
- [ ] Error states are handled gracefully

## 🚨 Common Issues & Solutions

### CORS Errors
- Ensure `FRONTEND_URL` is set correctly in backend
- Check that frontend domain is in allowed origins
- Verify CORS configuration in backend

### Authentication Errors
- Check `JWT_SECRET` is set correctly
- Verify token format in requests
- Ensure middleware is applied correctly

### Database Connection
- Verify `MONGODB_URI` is correct
- Check network connectivity
- Ensure database user has proper permissions

### Real-time Issues
- Check Socket.IO connection URL
- Verify JWT token is sent with socket connection
- Ensure CORS is configured for Socket.IO

## 📞 Support

If you encounter any issues during deployment:
1. Check the error logs in Vercel dashboard
2. Verify all environment variables are set correctly
3. Test endpoints individually using Postman or similar tool
4. Check browser console for frontend errors
5. Verify database connection and permissions 