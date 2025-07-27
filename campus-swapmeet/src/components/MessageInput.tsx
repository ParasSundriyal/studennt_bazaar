import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../contexts/ChatContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Paperclip, Smile } from 'lucide-react';

interface MessageInputProps {
  conversationId: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ conversationId }) => {
  const { sendMessage, setTyping } = useChat();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage('');
      setIsTyping(false);
      setTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicator
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      setTyping(true);
    } else if (isTyping && value.length === 0) {
      setIsTyping(false);
      setTyping(false);
    }

    // Clear typing indicator after 3 seconds of no typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setTyping(false);
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center space-x-2 bg-gray-50 rounded-xl p-2">
      {/* Attachment Button */}
      <Button
        variant="ghost"
        size="sm"
        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
        disabled
        title="File attachments coming soon"
      >
        <Paperclip className="h-3.5 w-3.5" />
      </Button>

      {/* Emoji Button */}
      <Button
        variant="ghost"
        size="sm"
        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
        disabled
        title="Emoji picker coming soon"
      >
        <Smile className="h-3.5 w-3.5" />
      </Button>

      {/* Message Input */}
      <div className="flex-1">
        <Input
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="border-0 focus:ring-0 focus:border-0 bg-transparent text-gray-900 placeholder-gray-500 text-sm"
          maxLength={1000}
        />
      </div>

      {/* Send Button */}
      <Button
        onClick={handleSend}
        disabled={!message.trim()}
        size="sm"
        className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <Send className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export default MessageInput; 