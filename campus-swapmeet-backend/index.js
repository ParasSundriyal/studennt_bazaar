require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please set these variables in your .env file or deployment environment');
  process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:8080',
        'http://localhost:3000',
        process.env.FRONTEND_URL
      ].filter(Boolean);
      
      if (
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin) // Allow any Vercel preview or production domain
      ) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin) // Allow any Vercel preview or production domain
    ) {
      return callback(null, true);
    }
    const msg = 'The CORS policy for this site does not allow access from the specified Origin: ' + origin;
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Total-Count']
}));
 // Allow preflight across all routes

app.use(express.json());

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(408).json({ 
      success: false, 
      message: 'Request timeout' 
    });
  });
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  next();
});

// Health check
app.get('/', (req, res) => res.send('Campus Swapmeet Backend Running'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority'
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/seller', require('./routes/seller'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chat', require('./routes/chat'));

// Socket.io connection handling
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Store connected users
const connectedUsers = new Map();

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  // Add user to connected users map
  connectedUsers.set(socket.userId, socket.id);

  // Join user to their personal room
  socket.join(socket.userId);

  // Handle joining conversation room
  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId);
  });

  // Handle leaving conversation room
  socket.on('leave-conversation', (conversationId) => {
    socket.leave(conversationId);
  });

        // Handle new message
      socket.on('send-message', async (data) => {
        try {
          const { conversationId, content, messageType = 'text', attachments = [] } = data;
          
          // Create message in database
          const Message = require('./models/Message');
          const Conversation = require('./models/Conversation');
          
          const message = new Message({
            conversationId,
            sender: socket.userId,
            content,
            messageType,
            attachments
          });
          
          await message.save();
          
          // Update conversation's last message
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            lastMessageTime: new Date()
          });
          
          // Populate sender info for the message
          await message.populate('sender', 'name collegeId');
          
          // Emit message to conversation room
          io.to(conversationId).emit('new-message', message);
          
          // Emit conversation update to all participants
          const conversation = await Conversation.findById(conversationId)
            .populate('participants', 'name collegeId collegeName')
            .populate('productId', 'title images price')
            .populate('lastMessage');
          
          // Emit to all participants in the conversation
          conversation.participants.forEach(participant => {
            io.to(participant._id.toString()).emit('conversation-updated', conversation);
          });
          
        } catch (error) {
          console.error('Error handling message:', error);
          socket.emit('message-error', { message: 'Error sending message' });
        }
      });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { conversationId, isTyping } = data;
    socket.to(conversationId).emit('user-typing', {
      userId: socket.userId,
      userName: socket.user.name,
      isTyping
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    connectedUsers.delete(socket.userId);
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      success: false, 
      message: 'Validation error', 
      errors: Object.values(err.errors).map(e => e.message) 
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid ID format' 
    });
  }
  
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(400).json({ 
      success: false, 
      message: 'Duplicate field value' 
    });
  }
  
  // Default error response
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 