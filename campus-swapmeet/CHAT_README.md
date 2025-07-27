# Campus Swapmeet Chat Feature

## Overview
A real-time chat system has been added to the Campus Swapmeet application, allowing users to communicate with sellers about products.

## Features

### Backend (Node.js/Express)
- **Socket.io Integration**: Real-time messaging with WebSocket connections
- **Chat Models**: 
  - `Conversation`: Manages chat conversations between users
  - `Message`: Stores individual messages with read status
- **Chat Routes**: RESTful API endpoints for chat operations
- **Authentication**: JWT-based authentication for chat access
- **Real-time Features**:
  - Instant message delivery
  - Typing indicators
  - Read receipts
  - Conversation updates

### Frontend (React/TypeScript)
- **Chat Context**: Global state management for chat functionality
- **Chat Widget**: Floating chat button with unread message count
- **Chat Interface**: Full-featured chat UI with conversation list and message display
- **Start Chat Button**: Component for initiating conversations from product pages
- **Real-time Updates**: Live message updates and typing indicators

## Components

### Backend Components
1. **Models**:
   - `Conversation.js`: Conversation schema with participants and product reference
   - `Message.js`: Message schema with sender, content, and read status

2. **Routes** (`/api/chat`):
   - `GET /conversations`: Get user's conversations
   - `POST /conversations`: Create or find conversation
   - `GET /conversations/:id/messages`: Get conversation messages
   - `POST /conversations/:id/messages`: Send message
   - `PUT /conversations/:id/read`: Mark as read
   - `DELETE /messages/:id`: Delete message
   - `GET /unread-count`: Get unread message count

3. **Socket Events**:
   - `join-conversation`: Join conversation room
   - `leave-conversation`: Leave conversation room
   - `send-message`: Send real-time message
   - `typing`: Typing indicator
   - `new-message`: Receive new message
   - `conversation-updated`: Conversation list update

### Frontend Components
1. **ChatContext**: Global chat state and socket management
2. **ChatWidget**: Floating chat button with unread count
3. **ChatInterface**: Main chat UI with conversation list and messages
4. **ConversationList**: List of user conversations
5. **MessageList**: Display messages in a conversation
6. **MessageInput**: Message input with typing indicators
7. **StartChatButton**: Button to initiate conversations

## Usage

### Starting a Chat
1. Users can click "Start Chat" on any product card
2. The system creates or finds an existing conversation
3. Users are automatically joined to the conversation room
4. Real-time messaging begins

### Chat Interface
1. Click the floating chat button to open the chat widget
2. View all conversations in the conversation list
3. Click on a conversation to open the chat
4. Send messages with real-time delivery
5. See typing indicators and read receipts

### Integration
The chat system is integrated into the existing application:
- Chat widget appears on all pages for authenticated users
- Product cards can include "Start Chat" buttons
- Chat state persists across page navigation
- Real-time updates work across browser tabs

## Environment Setup

### Backend
Add to your `.env` file:
```
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=your_mongodb_connection_string
FRONTEND_URL=http://localhost:8080
```

### Frontend
Add to your `.env` file:
```
VITE_API_URL=http://localhost:5000
```

## Dependencies

### Backend
- `socket.io`: Real-time WebSocket communication
- `jsonwebtoken`: JWT authentication
- `mongoose`: MongoDB ODM

### Frontend
- `socket.io-client`: Socket.io client library
- `date-fns`: Date formatting utilities
- `lucide-react`: Icons

## Security Features
- JWT authentication for all chat operations
- Socket authentication middleware
- User authorization checks for conversation access
- Input validation and sanitization
- Rate limiting (can be added)

## Future Enhancements
- File and image attachments
- Emoji picker
- Message reactions
- Group conversations
- Message search
- Push notifications
- Message encryption
- Chat history export

## Troubleshooting

### Common Issues
1. **Socket connection fails**: Check API URL and CORS settings
2. **Messages not sending**: Verify authentication token
3. **Real-time updates not working**: Check socket connection status
4. **Chat widget not appearing**: Ensure user is authenticated

### Debug Tips
- Check browser console for socket connection errors
- Verify backend server is running on correct port
- Ensure environment variables are properly set
- Check MongoDB connection for chat data 