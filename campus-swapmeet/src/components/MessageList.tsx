import React, { useEffect, useRef } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { format } from 'date-fns';

interface MessageListProps {
  conversationId: string;
}

const MessageList: React.FC<MessageListProps> = ({ conversationId }) => {
  const { messages, fetchMessages, typingUsers } = useChat();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages(conversationId);
  }, [conversationId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const isOwnMessage = (message: any) => {
    return message.sender._id === user?._id;
  };

  const renderMessage = (message: any) => {
    const own = isOwnMessage(message);

         return (
       <div
         key={message._id}
         className={`flex ${own ? 'justify-end' : 'justify-start'} mb-3`}
       >
        <div className={`flex ${own ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs`}>
          {/* Avatar */}
          {!own && (
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                {getInitials(message.sender.name)}
              </AvatarFallback>
            </Avatar>
          )}

          {/* Message Bubble */}
          <div
            className={`px-4 py-3 rounded-2xl max-w-xs break-words shadow-sm ${
              own
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                : 'bg-white text-gray-900 border border-gray-200'
            }`}
          >
            {!own && (
              <p className="text-xs font-medium mb-1 text-gray-600">
                {message.sender.name}
              </p>
            )}
            
            <p className="text-sm">{message.content}</p>
            
            <p className={`text-xs mt-1 ${
              own ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {formatTime(message.createdAt)}
              {message.isRead && own && (
                <span className="ml-1">✓✓</span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-600 text-sm">Start the conversation by sending a message!</p>
          </div>
                  ) : (
            <div className="space-y-3">
              {messages.map(renderMessage)}
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start mb-4">
                <div className="flex items-end space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                      {getInitials(typingUsers[0])}
                    </AvatarFallback>
                  </Avatar>
                  <div className="px-4 py-2 rounded-lg bg-gray-100">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default MessageList; 