// Mock data for the social media application

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  coverImage: string;
  followers: number;
  following: number;
  postsCount: number;
  isVerified: boolean;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

export interface TrendingTopic {
  id: string;
  name: string;
  category: string;
  postsCount: number;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    username: '_jhonjoshua',
    displayName: 'Jhon Joshua Abutan',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Senior Software Engineer | Building the future of web | Open source enthusiast',
    coverImage: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=400&fit=crop',
    followers: 12500,
    following: 890,
    postsCount: 342,
    isVerified: true,
  },
  {
    id: '2',
    username: 'sarahdev',
    displayName: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    bio: 'Product Designer @TechCorp | Creating beautiful digital experiences',
    coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop',
    followers: 8900,
    following: 450,
    postsCount: 128,
    isVerified: true,
  },
  {
    id: '3',
    username: 'mikeross',
    displayName: 'Mike Ross',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Full-stack developer | Coffee addict | Building cool stuff',
    coverImage: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200&h=400&fit=crop',
    followers: 5600,
    following: 780,
    postsCount: 89,
    isVerified: false,
  },
  {
    id: '4',
    username: 'emilywang',
    displayName: 'Emily Wang',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Tech writer & blogger | Sharing knowledge one post at a time',
    coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop',
    followers: 15200,
    following: 320,
    postsCount: 456,
    isVerified: true,
  },
  {
    id: '5',
    username: 'davidkim',
    displayName: 'David Kim',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: 'Startup founder | Angel investor | Helping others succeed',
    coverImage: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1200&h=400&fit=crop',
    followers: 45000,
    following: 200,
    postsCount: 678,
    isVerified: true,
  },
];

export const currentUser = mockUsers[0];

// Mock Posts
export const mockPosts: Post[] = [
  {
    id: '1',
    author: mockUsers[1],
    content: 'Just shipped a new feature! The team worked incredibly hard on this one. So proud of what we accomplished together. 🚀',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=500&fit=crop',
    likes: 245,
    comments: 34,
    shares: 12,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2h ago',
  },
  {
    id: '2',
    author: mockUsers[2],
    content: 'Hot take: TypeScript is not just JavaScript with types. It fundamentally changes how you think about code architecture and design patterns.',
    likes: 892,
    comments: 156,
    shares: 45,
    isLiked: true,
    isBookmarked: true,
    createdAt: '4h ago',
  },
  {
    id: '3',
    author: mockUsers[3],
    content: 'New blog post: "10 Things I Wish I Knew When Starting My Developer Journey" - link in bio! What would you add to this list?',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=500&fit=crop',
    likes: 1240,
    comments: 89,
    shares: 234,
    isLiked: false,
    isBookmarked: false,
    createdAt: '6h ago',
  },
  {
    id: '4',
    author: mockUsers[4],
    content: 'Excited to announce our Series B funding! Thank you to everyone who believed in our vision. The journey is just beginning.',
    likes: 3456,
    comments: 445,
    shares: 567,
    isLiked: true,
    isBookmarked: false,
    createdAt: '8h ago',
  },
  {
    id: '5',
    author: mockUsers[1],
    content: 'Design tip: Always test your UI with real content. Lorem ipsum hides so many layout issues that only appear with actual data.',
    likes: 567,
    comments: 78,
    shares: 23,
    isLiked: false,
    isBookmarked: true,
    createdAt: '12h ago',
  },
];

// Mock Conversations
export const mockConversations: Conversation[] = [
  {
    id: '1',
    participant: mockUsers[1],
    lastMessage: 'That sounds great! Let me know when you are free.',
    lastMessageTime: '2m ago',
    unreadCount: 3,
    messages: [
      { id: '1', senderId: '2', content: 'Hey! How are you doing?', timestamp: '10:30 AM', isRead: true },
      { id: '2', senderId: '1', content: 'I am doing great, thanks! Working on a new project.', timestamp: '10:32 AM', isRead: true },
      { id: '3', senderId: '2', content: 'That is awesome! What kind of project?', timestamp: '10:35 AM', isRead: true },
      { id: '4', senderId: '1', content: 'A social media app with Next.js. Really excited about it!', timestamp: '10:40 AM', isRead: true },
      { id: '5', senderId: '2', content: 'That sounds great! Let me know when you are free.', timestamp: '10:45 AM', isRead: false },
    ],
  },
  {
    id: '2',
    participant: mockUsers[2],
    lastMessage: 'Can you review my PR when you get a chance?',
    lastMessageTime: '1h ago',
    unreadCount: 1,
    messages: [
      { id: '1', senderId: '3', content: 'Hey, quick question about the codebase', timestamp: '9:00 AM', isRead: true },
      { id: '2', senderId: '1', content: 'Sure, what is up?', timestamp: '9:05 AM', isRead: true },
      { id: '3', senderId: '3', content: 'Can you review my PR when you get a chance?', timestamp: '9:10 AM', isRead: false },
    ],
  },
  {
    id: '3',
    participant: mockUsers[3],
    lastMessage: 'Thanks for sharing that article!',
    lastMessageTime: '3h ago',
    unreadCount: 0,
    messages: [
      { id: '1', senderId: '1', content: 'Check out this article I found!', timestamp: '6:00 AM', isRead: true },
      { id: '2', senderId: '4', content: 'Thanks for sharing that article!', timestamp: '6:30 AM', isRead: true },
    ],
  },
  {
    id: '4',
    participant: mockUsers[4],
    lastMessage: 'Looking forward to the meeting tomorrow',
    lastMessageTime: '1d ago',
    unreadCount: 0,
    messages: [
      { id: '1', senderId: '5', content: 'Hi! I wanted to discuss the investment opportunity.', timestamp: 'Yesterday', isRead: true },
      { id: '2', senderId: '1', content: 'Absolutely! When works for you?', timestamp: 'Yesterday', isRead: true },
      { id: '3', senderId: '5', content: 'How about tomorrow at 2pm?', timestamp: 'Yesterday', isRead: true },
      { id: '4', senderId: '1', content: 'Perfect!', timestamp: 'Yesterday', isRead: true },
      { id: '5', senderId: '5', content: 'Looking forward to the meeting tomorrow', timestamp: 'Yesterday', isRead: true },
    ],
  },
];

// Mock Trending Topics
export const mockTrendingTopics: TrendingTopic[] = [
  { id: '1', name: '#NextJS16', category: 'Technology', postsCount: 15420 },
  { id: '2', name: '#AIRevolution', category: 'Technology', postsCount: 89300 },
  { id: '3', name: '#WebDev', category: 'Technology', postsCount: 45600 },
  { id: '4', name: '#StartupLife', category: 'Business', postsCount: 23400 },
  { id: '5', name: '#DesignSystems', category: 'Design', postsCount: 12800 },
  { id: '6', name: '#OpenSource', category: 'Technology', postsCount: 34500 },
];

// Suggested Accounts
export const suggestedAccounts = mockUsers.slice(1, 5);

// Helper function to format numbers
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
