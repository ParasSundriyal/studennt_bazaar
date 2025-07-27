import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface Message {
  _id: string;
  conversationId: string;
  sender: {
    _id: string;
    name: string;
    collegeId: string;
  };
  content: string;
  messageType: 'text' | 'image' | 'file';
  attachments: Array<{
    url: string;
    filename: string;
    fileType: string;
    fileSize: number;
  }>;
  isRead: boolean;
  readAt?: Date;
  createdAt: string;
  formattedTime?: string;
}

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    collegeId: string;
    collegeName: string;
  }>;
  productId: {
    _id: string;
    title: string;
    images: string[];
    price: number;
  };
  lastMessage?: Message;
  lastMessageTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChatContextType {
  socket: Socket | null;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  unreadCount: number;
  isConnected: boolean;
  typingUsers: string[];
  setCurrentConversation: (conversation: Conversation | null) => void;
  sendMessage: (content: string, messageType?: 'text' | 'image' | 'file', attachments?: any[]) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  markAsRead: (conversationId: string) => void;
  setTyping: (isTyping: boolean) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string, page?: number) => Promise<void>;
  createConversation: (otherUserId: string, productId: string) => Promise<Conversation>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to get API URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const api = (path: string) => `${API_URL}${path}`;
  
  // Helper to get Socket.IO URL (remove /api if present)
  const getSocketUrl = () => {
    let url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    if (url.endsWith('/api')) {
      url = url.replace('/api', '');
    }
    return url;
  };

  // Initialize socket connection
  useEffect(() => {
    if (token && user) {
      const socketUrl = getSocketUrl();
      const newSocket = io(socketUrl, {
        auth: {
          token
        }
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        setIsConnected(false);
      });

      newSocket.on('new-message', (message: Message) => {
        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(m => m._id === message._id);
          if (exists) return prev;
          
          // Replace temporary message with real one if it exists
          const hasTempMessage = prev.some(m => m._id.startsWith('temp-'));
          if (hasTempMessage) {
            return prev.map(m => m._id.startsWith('temp-') ? message : m);
          }
          
          return [...prev, message];
        });
        
        // Update conversation list with new message
        setConversations(prev => 
          prev.map(conv => 
            conv._id === message.conversationId 
              ? { ...conv, lastMessage: message, lastMessageTime: message.createdAt }
              : conv
          )
        );
      });

      newSocket.on('conversation-updated', (conversation: Conversation) => {
        setConversations(prev => {
          // Check if conversation already exists
          const exists = prev.some(c => c._id === conversation._id);
          if (exists) {
            // Update existing conversation
            return prev.map(conv => 
              conv._id === conversation._id ? conversation : conv
            );
          } else {
            // Add new conversation
            return [conversation, ...prev];
          }
        });
      });

      newSocket.on('user-typing', (data: { userId: string; userName: string; isTyping: boolean }) => {
        if (data.isTyping) {
          setTypingUsers(prev => [...new Set([...prev, data.userName])]);
        } else {
          setTypingUsers(prev => prev.filter(name => name !== data.userName));
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token, user]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch(api('/chat/conversations'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Deduplicate conversations by _id
        const uniqueConversations = data.data.filter((conversation: any, index: number, self: any[]) => 
          index === self.findIndex((c: any) => c._id === conversation._id)
        );
        setConversations(uniqueConversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string, page = 1) => {
    try {
      const response = await fetch(
        api(`/chat/conversations/${conversationId}/messages?page=${page}&limit=50`),
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Deduplicate messages by _id
        const uniqueMessages = data.data.filter((message: any, index: number, self: any[]) => 
          index === self.findIndex((m: any) => m._id === message._id)
        );
        
        if (page === 1) {
          setMessages(uniqueMessages);
        } else {
          setMessages(prev => {
            const combined = [...uniqueMessages, ...prev];
            // Deduplicate combined messages
            return combined.filter((message: any, index: number, self: any[]) => 
              index === self.findIndex((m: any) => m._id === message._id)
            );
          });
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Create a new conversation
  const createConversation = async (otherUserId: string, productId: string): Promise<Conversation> => {
    const response = await fetch(api('/chat/conversations'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ otherUserId, productId })
    });

    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }

    const data = await response.json();
    const newConversation = data.data;
    
    setConversations(prev => {
      // Check if conversation already exists
      const exists = prev.some(c => c._id === newConversation._id);
      if (exists) {
        return prev.map(conv => 
          conv._id === newConversation._id ? newConversation : conv
        );
      } else {
        return [newConversation, ...prev];
      }
    });
    return newConversation;
  };

  // Send a message
  const sendMessage = (content: string, messageType: 'text' | 'image' | 'file' = 'text', attachments: any[] = []) => {
    if (!socket || !currentConversation || !content.trim()) {
      return;
    }

    // Create a temporary message object for immediate display
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      conversationId: currentConversation._id,
      sender: {
        _id: user?._id || '',
        name: user?.name || '',
        collegeId: user?.collegeId || ''
      },
      content: content.trim(),
      messageType,
      attachments,
      isRead: false,
      createdAt: new Date().toISOString(),
      formattedTime: new Date().toLocaleTimeString()
    };

    // Add message to local state immediately
    setMessages(prev => [...prev, tempMessage]);

    // Update conversation with the new message
    setConversations(prev => 
      prev.map(conv => 
        conv._id === currentConversation._id 
          ? { 
              ...conv, 
              lastMessage: tempMessage, 
              lastMessageTime: tempMessage.createdAt 
            }
          : conv
      )
    );

    // Emit to socket
    socket.emit('send-message', {
      conversationId: currentConversation._id,
      content: content.trim(),
      messageType,
      attachments
    });
  };

  // Join a conversation room
  const joinConversation = (conversationId: string) => {
    if (socket) {
      socket.emit('join-conversation', conversationId);
    }
  };

  // Leave a conversation room
  const leaveConversation = (conversationId: string) => {
    if (socket) {
      socket.emit('leave-conversation', conversationId);
    }
  };

  // Mark conversation as read
  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(api(`/chat/conversations/${conversationId}/read`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Set typing indicator
  const setTyping = (isTyping: boolean) => {
    if (!socket || !currentConversation) return;

    socket.emit('typing', {
      conversationId: currentConversation._id,
      isTyping
    });

    // Clear typing indicator after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 3000);
    }
  };

  // Fetch conversations on mount
  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(api('/chat/unread-count'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    if (token) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [token]);

  const value: ChatContextType = {
    socket,
    conversations,
    currentConversation,
    messages,
    unreadCount,
    isConnected,
    typingUsers,
    setCurrentConversation,
    sendMessage,
    joinConversation,
    leaveConversation,
    markAsRead,
    setTyping,
    fetchConversations,
    fetchMessages,
    createConversation
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 