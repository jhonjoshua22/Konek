import Head from 'next/head';
import { useState } from 'react';
import { Search, Send, MoreHorizontal, Phone, Video, Info, ArrowLeft, BadgeCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { mockConversations, currentUser, type Conversation } from '@/lib/mock-data';

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedConversation) {
      // Mock send message
      alert(`Message sent: ${newMessage}`);
      setNewMessage('');
    }
  };

  const filteredConversations = mockConversations.filter((conv) =>
    conv.participant.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Messages / Konek</title>
        <meta name="description" content="Your direct messages." />
      </Head>

      <div className="min-h-screen border-x border-border flex">
        {/* Conversations List */}
        <div
          className={cn(
            'w-full md:w-96 border-r border-border flex flex-col',
            selectedConversation ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg p-4">
            <h1 className="text-xl font-bold text-foreground mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Direct Messages"
                className="w-full rounded-full bg-secondary border-0 pl-10 focus-visible:ring-primary"
              />
            </div>
          </header>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left',
                  selectedConversation?.id === conversation.id && 'bg-secondary/50'
                )}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={conversation.participant.avatar}
                      alt={conversation.participant.displayName}
                    />
                    <AvatarFallback>{conversation.participant.displayName[0]}</AvatarFallback>
                  </Avatar>
                  {conversation.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center font-medium">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground truncate flex items-center gap-1">
                      {conversation.participant.displayName}
                      {conversation.participant.isVerified && (
                        <BadgeCheck className="h-4 w-4 text-primary" />
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {conversation.lastMessageTime}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-sm truncate',
                      conversation.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}
                  >
                    {conversation.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div
          className={cn(
            'flex-1 flex flex-col',
            selectedConversation ? 'flex' : 'hidden md:flex'
          )}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg p-4 flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden rounded-full p-2 hover:bg-secondary/50 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={selectedConversation.participant.avatar}
                    alt={selectedConversation.participant.displayName}
                  />
                  <AvatarFallback>
                    {selectedConversation.participant.displayName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    {selectedConversation.participant.displayName}
                    {selectedConversation.participant.isVerified && (
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{selectedConversation.participant.username}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="rounded-full p-2 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="rounded-full p-2 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="rounded-full p-2 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
                    <Info className="h-5 w-5" />
                  </button>
                </div>
              </header>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.map((message) => {
                  const isCurrentUser = message.senderId === currentUser.id;
                  return (
                    <div
                      key={message.id}
                      className={cn('flex', isCurrentUser ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[70%] rounded-2xl px-4 py-3',
                          isCurrentUser
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-secondary text-foreground rounded-bl-md'
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={cn(
                            'text-xs mt-1',
                            isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          )}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Start a new message"
                    className="flex-1 rounded-full bg-secondary border-0 focus-visible:ring-primary"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim()}
                    className="rounded-full"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Select a message
                </h2>
                <p className="text-muted-foreground">
                  Choose from your existing conversations or start a new one.
                </p>
                <Button className="mt-6 rounded-full">New Message</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
