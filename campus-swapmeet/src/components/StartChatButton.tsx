import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { MessageCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface StartChatButtonProps {
  sellerId: string;
  productId: string;
  productTitle: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const StartChatButton: React.FC<StartChatButtonProps> = ({
  sellerId,
  productId,
  productTitle,
  className = '',
  variant = 'default',
  size = 'default'
}) => {
  const { createConversation, setCurrentConversation } = useChat();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartChat = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to start a chat",
        variant: "destructive"
      });
      return;
    }

    if (user.id === sellerId) {
      toast({
        title: "Cannot chat with yourself",
        description: "You cannot start a chat for your own product",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const conversation = await createConversation(sellerId, productId);
      setCurrentConversation(conversation);
      
      toast({
        title: "Chat started!",
        description: `You can now chat about ${productTitle}`,
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleStartChat}
      disabled={isLoading || user?.id === sellerId}
      variant={variant}
      size={size}
      className={`${className} ${user?.id === sellerId ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      {isLoading ? 'Starting chat...' : 'Start Chat'}
    </Button>
  );
};

export default StartChatButton; 