"use client";

import { useState } from "react";
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, User, UserPlus, X, Search } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface Participant {
  id: string;
  type: 'user' | 'guest';
  name: string;
  email?: string;
  userId?: any; // Convex ID type
}

interface FriendSelectorProps {
  participants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
}

export function FriendSelector({ participants, onParticipantsChange }: FriendSelectorProps) {
  const { currentUser } = useCurrentUser();
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const friends = useQuery(api.friends.getFriends, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  
  // Search for users when typing in guest name field
  // Use the existing checkUserByUsername function for exact username matches
  const normalizedSearchTerm = guestName.trim().toLowerCase();
  const searchUserResult = useQuery(
    api.friends.checkUserByUsername,
    normalizedSearchTerm.length >= 2 ? { username: normalizedSearchTerm } : "skip"
  );
  
  // Search through friends list for partial matches (this works and is already available)
  const searchUsersFromFriends = friends?.filter(friend => {
    if (!friend) return false;
    const username = (friend.username || '').toLowerCase();
    const name = (friend.name || '').toLowerCase();
    const email = (friend.email || '').toLowerCase();
    return username.includes(normalizedSearchTerm) || 
           name.includes(normalizedSearchTerm) || 
           email.includes(normalizedSearchTerm);
  }) || [];
  
  // Combine search results
  const searchUsers: any[] = [];
  if (searchUserResult?.exists && searchUserResult.user) {
    searchUsers.push(searchUserResult.user);
  }
  // Add friends that match (but filter out duplicates)
  searchUsersFromFriends.forEach(f => {
    if (f && !searchUsers.some(u => u._id === f._id)) {
      searchUsers.push(f);
    }
  });

  // Filter friends based on search query
  const filteredFriends = friends?.filter(friend => {
    if (!friend) return false;
    const name = friend.username || friend.name || friend.email || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  // Filter out current user and already added participants from search results
  const filteredSearchUsers = (Array.isArray(searchUsers) ? searchUsers : [])?.filter((user: any) => {
    if (!user) return false;
    // Don't show current user
    if (currentUser && user._id === currentUser._id) return false;
    // Don't show already added participants
    if (participants.some(p => p.userId === user._id)) return false;
    return true;
  }) || [];

  const addFriend = (friend: any, clearSearch: boolean = false) => {
    const newParticipant: Participant = {
      id: `user-${friend._id}`,
      type: 'user',
      name: friend.username || friend.name || friend.email,
      email: friend.email,
      userId: friend._id,
    };

    // Check if already added
    if (participants.some(p => p.userId === friend._id)) {
      return;
    }

    onParticipantsChange([...participants, newParticipant]);
    
    // Clear search field if requested
    if (clearSearch) {
      setGuestName('');
      setGuestEmail('');
    }
  };

  const addGuest = () => {
    if (!guestName.trim()) return;

    // Check if there's a matching user first
    const matchingUser = filteredSearchUsers.find((user: any) => {
      const username = (user.username || '').toLowerCase();
      const name = (user.name || '').toLowerCase();
      const searchTerm = guestName.trim().toLowerCase();
      return username === searchTerm || name === searchTerm;
    });

    if (matchingUser) {
      // Add as existing user instead of guest
      addFriend(matchingUser, true);
      return;
    }

    // Add as guest if no matching user found
    const newParticipant: Participant = {
      id: `guest-${Date.now()}`,
      type: 'guest',
      name: guestName.trim(),
      email: guestEmail.trim() || undefined,
    };

    onParticipantsChange([...participants, newParticipant]);
    setGuestName('');
    setGuestEmail('');
  };


  const removeParticipant = (id: string) => {
    onParticipantsChange(participants.filter(p => p.id !== id));
  };

  return (
    <Card className="w-full">
      <CardHeader className="w-full">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 flex-shrink-0" />
          Playing With
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 w-full min-w-0">

        {/* Add Participants */}
        <div className="space-y-3">
          {/* Add Friends - Search Bar */}
          {friends && friends.length > 0 && (
            <div className="space-y-3">
              <Label>Add Friends</Label>
              <div className="relative">
                <Input
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8"
                  />
                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* Only show results when searching */}
              {searchQuery && (
                <>
                  {/* Filtered Friends List */}
                  {filteredFriends
                    .filter(friend => friend && !participants.some(p => p.userId === friend._id))
                    .length > 0 ? (
                      <div className="max-h-32 overflow-y-auto space-y-2">
                      {filteredFriends
                        .filter(friend => friend && !participants.some(p => p.userId === friend._id))
                        .map((friend) => (
                          <div
                          key={friend?._id}
                          className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => friend && addFriend(friend)}
                          >
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium text-sm">{friend?.username || friend?.name || friend?.email}</span>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No friends found matching "{searchQuery}"
                    </div>
                  )}
                </>
              )}
            </div>
          )}


          {/* Add Guest or Search Players */}
          <div className="space-y-2 w-full">
            <Label>Add Player or Guest</Label>
            <div className="flex gap-2 w-full min-w-0">
              <div className="relative flex-1 min-w-0">
                <Input
                  placeholder="Search players or enter guest name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="pr-8 w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && guestName.trim()) {
                      addGuest();
                    }
                  }}
                  />
                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Button 
                onClick={addGuest} 
                disabled={!guestName.trim()}
                variant="outline"
                className="flex-shrink-0"
                >
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            
            {/* Show search results for existing users */}
            {guestName.trim().length >= 2 && (
              <>
                {filteredSearchUsers.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2 bg-muted/30 w-full">
                    <div className="text-xs text-muted-foreground mb-2 px-1">
                      Found {filteredSearchUsers.length} user{filteredSearchUsers.length !== 1 ? 's' : ''}
                    </div>
                    {filteredSearchUsers.map((user: any) => (
                      <div
                      key={user._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors bg-background w-full min-w-0"
                      onClick={() => addFriend(user, true)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                            <span className="font-medium text-sm truncate">
                              {user.name || user.username || user.email}
                            </span>
                            <div className="flex gap-2 text-xs text-muted-foreground min-w-0">
                              {user.username && (
                                <span className="truncate">@{user.username}</span>
                              )}
                              {user.email && (
                                <span className="truncate">{user.email}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="flex-shrink-0 ml-2">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg bg-muted/30 w-full">
                    No users found matching "{guestName}"
                    <div className="text-xs mt-1">Press "Add" to create a guest player</div>
                  </div>
                )}
              </>
            )}

            {guestEmail && (
              <Input
              type="email"
              placeholder="Email (optional)"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="w-full"
              />
            )}
          </div>
        </div>

      {/* Current Participants */}
      {participants.length > 0 && (
        <div className="space-y-2">
          <Label>Participants ({participants.length + 1})</Label>
          <div className="space-y-2">
            {/* Main player */}
            <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">You</span>
                <Badge variant="secondary">Host</Badge>
              </div>
            </div>
            
            {/* Other participants */}
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  {participant.type === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  <span className="font-medium">{participant.name}</span>
                  <Badge variant={participant.type === 'user' ? 'default' : 'outline'}>
                    {participant.type === 'user' ? 'Friend' : 'Guest'}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeParticipant(participant.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      </CardContent>
    </Card>
  );
}
