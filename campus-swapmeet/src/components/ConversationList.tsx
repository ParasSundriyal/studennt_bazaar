import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';

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
  lastMessage?: {
    _id: string;
    content: string;
    sender: {
      _id: string;
      name: string;
    };
    createdAt: string;
  };
  lastMessageTime: string;
  isActive: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  currentUser: any;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelectConversation,
  currentUser
}) => {
  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p._id !== currentUser?._id);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastMessage = (conversation: Conversation) => {
    if (!conversation.lastMessage) {
      return 'No messages yet';
    }

    const isOwnMessage = conversation.lastMessage.sender._id === currentUser?._id;
    const prefix = isOwnMessage ? 'You: ' : '';
    const content = conversation.lastMessage.content;
    
    return `${prefix}${content.length > 30 ? content.substring(0, 30) + '...' : content}`;
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No conversations yet</h3>
        <p className="text-gray-600 text-sm">Start chatting with sellers about products you're interested in!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        {conversations.map((conversation) => {
          const otherParticipant = getOtherParticipant(conversation);
          const hasUnreadMessages = conversation.lastMessage && 
            conversation.lastMessage.sender._id !== currentUser?._id;

          return (
            <div
              key={`${conversation._id}-${conversation.lastMessageTime}`}
              onClick={() => onSelectConversation(conversation)}
              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white cursor-pointer transition-all duration-200 bg-gray-50/50 hover:shadow-md border border-transparent hover:border-gray-200"
            >
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src="" alt={otherParticipant?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-sm">
                    {getInitials(otherParticipant?.name || '')}
                  </AvatarFallback>
                </Avatar>
                {hasUnreadMessages && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {otherParticipant?.name}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 truncate">
                  {formatLastMessage(conversation)}
                </p>
                
                <div className="flex items-center space-x-2 mt-1">
                  <img
                    src={conversation.productId.images[0]}
                    alt={conversation.productId.title}
                    className="w-4 h-4 object-cover rounded"
                  />
                  <span className="text-xs text-gray-400 truncate">
                    {conversation.productId.title}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    ${conversation.productId.price}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default ConversationList; 