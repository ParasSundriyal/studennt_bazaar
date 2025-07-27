import React, { useState, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { X, Send, MessageCircle } from 'lucide-react';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatInterfaceProps {
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose }) => {
  const { 
    conversations, 
    currentConversation, 
    setCurrentConversation,
    joinConversation,
    leaveConversation,
    markAsRead,
    fetchConversations
  } = useChat();
  const { user } = useAuth();
  const [view, setView] = useState<'conversations' | 'chat'>('conversations');

  useEffect(() => {
    if (currentConversation) {
      setView('chat');
      joinConversation(currentConversation._id);
      markAsRead(currentConversation._id);
    } else {
      setView('conversations');
    }
  }, [currentConversation]);

  const handleConversationSelect = (conversation: any) => {
    if (currentConversation) {
      leaveConversation(currentConversation._id);
    }
    setCurrentConversation(conversation);
  };

  const handleBackToConversations = () => {
    if (currentConversation) {
      leaveConversation(currentConversation._id);
    }
    setCurrentConversation(null);
    setView('conversations');
  };

  const getOtherParticipant = (conversation: any) => {
    return conversation.participants.find((p: any) => p._id !== user?._id);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center space-x-3">
          {view === 'chat' && currentConversation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToConversations}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          )}
          
          <div>
            <h3 className="font-bold text-lg">
              {view === 'conversations' ? '💬 Messages' : '💬 Chat'}
            </h3>
            {view === 'chat' && currentConversation && (
              <p className="text-sm text-blue-100 font-medium">
                {getOtherParticipant(currentConversation)?.name}
              </p>
            )}
          </div>
        </div>
        

        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        {view === 'conversations' ? (
          <ConversationList
            conversations={conversations}
            onSelectConversation={handleConversationSelect}
            currentUser={user}
          />
        ) : (
          <div className="flex flex-col h-full bg-white">
            {currentConversation && (
              <>
                {/* Product Info */}
                <div className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-green-100">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={currentConversation.productId.images[0]}
                        alt={currentConversation.productId.title}
                        className="w-12 h-12 object-cover rounded-lg border-2 border-white shadow-sm"
                      />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {currentConversation.productId.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-base font-bold text-green-600">
                          ${currentConversation.productId.price}
                        </span>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-hidden">
                  <MessageList conversationId={currentConversation._id} />
                </div>

                {/* Message Input */}
                <div className="p-3 border-t bg-white">
                  <MessageInput conversationId={currentConversation._id} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface; 