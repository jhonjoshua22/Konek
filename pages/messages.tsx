import Head from 'next/head';
import { useState, useEffect } from 'react';
import { Search, Send, MoreHorizontal, Phone, Video, Info, ArrowLeft, BadgeCheck, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Hook up active session metadata
  useEffect(() => {
    async function initSession() {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setCurrentUserId(data.session.user.id);
        fetchConversations(data.session.user.id);
      } else {
        setLoading(false);
      }
    }
    initSession();
  }, []);

  // 2. Load conversations list matching the database structure
  async function fetchConversations(userId: string) {
    try {
      setLoading(true);
      
      // Get all conversation rooms where the current user is listed as a participant
      const { data: participations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (partError) throw partError;

      if (!participations || participations.length === 0) {
        setConversations([]);
        return;
      }

      const conversationIds = participations.map(p => p.conversation_id);

      // Fetch conversation rooms with all messaging and participant rows matching those IDs
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          conversation_participants (
            profiles (id, username, display_name, avatar, is_verified)
          ),
          messages (id, content, sender_id, is_read, created_at)
        `)
        .in('id', conversationIds);

      if (convError) throw convError;

      if (convData) {
        const formatted = convData.map((room: any) => {
          // Isolate the opposite participant's profile details
          const otherParticipant = room.conversation_participants
            ?.map((p: any) => p.profiles)
            .find((profile: any) => profile && profile.id !== userId) || {
              id: 'unknown',
              display_name: 'Konek User',
              username: 'user',
              avatar: '',
              is_verified: false
            };

          // Order the message lines chronologically to locate the most recent entry
          const roomMessages = [...(room.messages || [])].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

          const lastMsg = roomMessages[roomMessages.length - 1];
          const unreadCount = roomMessages.filter(m => m.sender_id !== userId && !m.is_read).length;

          const lastMsgTime = lastMsg 
            ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : '';

          return {
            id: room.id,
            participant: {
              id: otherParticipant.id,
              displayName: otherParticipant.display_name,
              username: otherParticipant.username,
              avatar: otherParticipant.avatar,
              isVerified: otherParticipant.is_verified
            },
            lastMessage: lastMsg ? lastMsg.content : 'No messages yet',
            lastMessageTime,
            unreadCount,
            rawMessages: roomMessages
          };
        });

        setConversations(formatted);

        // Sync the loaded room logs if a conversation window is open
        if (selectedConversation) {
          const updatedSelected = formatted.find(c => c.id === selectedConversation.id);
          if (updatedSelected) {
            setMessages(updatedSelected.rawMessages);
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching conversation structures:', err.message);
    } finally {
      setLoading(false);
    }
  }

  // 3. Sync messages view list when a row item is actively selected
  useEffect(() => {
    if (selectedConversation) {
      setMessages(selectedConversation.rawMessages || []);
      
      // Automatically mark received rows as read in the database
      if (selectedConversation.unreadCount > 0 && currentUserId) {
        supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', selectedConversation.id)
          .not('sender_id', 'eq', currentUserId)
          .then(() => {
            // Silently sync state metrics locally to clear notification badge counters
            setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, unreadCount: 0 } : c));
          });
      }
    }
  }, [selectedConversation]);

  // 4. Send action processor appending directly into PostgreSQL schema rules
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    try {
      const messagePayload = {
        conversation_id: selectedConversation.id,
        sender_id: currentUserId,
        content: newMessage.trim(),
        is_read: false
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([messagePayload])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Optimistically update message string streams locally to maintain instant feedback loop responses
        setMessages(prev => [...prev, data]);
        setNewMessage('');
        
        // Refresh structural wrapper definitions to align lastMessage values accurately
        if (currentUserId) {
          fetchConversations(currentUserId);
        }
      }
    } catch (err: any) {
      console.error('Failed to dispatch database message payload:', err.message);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.participant.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Messages / Konek</title>
        <meta name="description" content="Your direct messages." />
      </Head>

      <div className="min-h-screen border-x border-border flex-1 flex">
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
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No active conversations found.
              </div>
            ) : (
              filteredConversations.map((conversation) => (
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
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div
          className={cn(
            'flex-1 flex flex-col bg-background/50',
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
                {messages.map((message) => {
                  const isCurrentUser = message.sender_id === currentUserId;
                  const messageTime = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
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
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        <p
                          className={cn(
                            'text-[10px] mt-1 text-right',
                            isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          )}
                        >
                          {messageTime}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-border p-4 bg-background"
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