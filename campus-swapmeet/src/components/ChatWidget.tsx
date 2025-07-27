import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MessageCircle, X } from 'lucide-react';
import ChatInterface from './ChatInterface';

interface ChatWidgetProps {
  onClose: () => void;
  isOpen?: boolean;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ onClose, isOpen = false }) => {
  const { unreadCount } = useChat();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl shadow-2xl w-full max-w-md h-[90vh] flex flex-col overflow-hidden border border-gray-200">
            <ChatInterface onClose={onClose} />
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget; 