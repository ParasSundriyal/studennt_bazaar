import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MessageCircle, X } from 'lucide-react';
import ChatInterface from './ChatInterface';

const FloatingChatButton: React.FC = () => {
  const { unreadCount } = useChat();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="relative h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 group"
        >
          {isOpen ? (
            <X className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
          ) : (
            <MessageCircle className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
          )}
          
          {/* Unread Badge */}
          {unreadCount > 0 && !isOpen && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          

        </Button>
      </div>

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-end bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl shadow-2xl w-full max-w-md h-[90vh] flex flex-col overflow-hidden border border-gray-200">
            <ChatInterface onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatButton; 