"use client";

import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { Share, Copy, Search, Check, X, Loader2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FriendsPage() {
  const { user } = useUser();
  const [inviteQuery, setInviteQuery] = useState('');
  const [myUsername, setMyUsername] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const { toast } = useToast();

  const currentUser = useQuery(api.users.getCurrentUser, 
    user ? { clerkId: user.id } : "skip"
  );
  
  const friends = useQuery(api.friends.getFriends, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const userRounds = useQuery(api.rounds.getByUser,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const pendingRequests = useQuery(api.friends.getPendingRequests, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const leaderboard = useQuery(api.stats.getLeaderboard, 
    currentUser ? { friendsOnly: true, userId: currentUser._id } : "skip"
  );

  const inviteFriend = useMutation(api.friends.inviteFriend);
  const inviteFriendByUsername = useMutation(api.friends.inviteFriendByUsername);
  const acceptFriend = useMutation(api.friends.acceptFriend);
  const rejectFriend = useMutation(api.friends.rejectFriend);
  const updateUserWithUsername = useMutation(api.users.updateUserWithUsername);
  const isEmailInput = !!inviteQuery && /[^\s@]+@[^\s@]+\.[^\s@]+/.test(inviteQuery.trim());
  const normalizedUsername = !isEmailInput ? inviteQuery.trim().replace(/^@/, '') : '';
  const [debouncedUsername, setDebouncedUsername] = useState('');
  useEffect(() => {
    if (isEmailInput) {
      setDebouncedUsername('');
      return;
    }
    const value = normalizedUsername;
    const t = setTimeout(() => setDebouncedUsername(value), 300);
    return () => clearTimeout(t);
  }, [normalizedUsername, isEmailInput]);
  const checkUserByUsername = useQuery(api.friends.checkUserByUsername, 
    debouncedUsername ? { username: debouncedUsername } : "skip"
  );
  const checkMyUsername = useQuery(api.users.checkUsername, 
    myUsername ? { username: myUsername } : "skip"
  );

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !inviteQuery.trim()) return;

    setIsInviting(true);
    try {
      if (isEmailInput) {
        const emailToInvite = inviteQuery.trim().toLowerCase();
        await inviteFriend({ requesterId: currentUser._id, addresseeEmail: emailToInvite });
        toast({ title: 'Friend request sent!', description: `Friend request sent to ${emailToInvite}` });
      } else {
        const handle = normalizedUsername;
        if (!handle) return;
        await inviteFriendByUsername({ requesterId: currentUser._id, username: handle });
        toast({ title: 'Friend request sent!', description: `Friend request sent to @${handle}` });
      }
      setInviteQuery('');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send friend request. Please try again.', variant: 'destructive' });
    } finally {
      setIsInviting(false);
    }
  };

  const handleAcceptFriend = async (friendshipId: any) => {
    try {
      await acceptFriend({ friendshipId });
      toast({
        title: "Friend request accepted!",
        description: "You are now friends.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept friend request.",
        variant: "destructive",
      });
    }
  };

  const handleRejectFriend = async (friendshipId: any) => {
    try {
      await rejectFriend({ friendshipId });
      toast({
        title: "Friend request rejected",
        description: "The friend request has been declined.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject friend request.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !myUsername) return;

    setIsUpdatingUsername(true);
    try {
      await updateUserWithUsername({
        clerkId: user.id,
        username: myUsername,
      });
      
      toast({
        title: "Username updated!",
        description: `Your username is now @${myUsername}`,
      });
      
      setMyUsername('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update username. It might already be taken.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleShareProfile = async () => {
    if (!currentUser) return;
    const usernameToShare = currentUser.username;
    const shareText = usernameToShare
      ? `Add me on DiscGolfP: @${usernameToShare}`
      : `Add me on DiscGolfP!`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

    try {
      if (navigator.share) {
        await navigator.share({ title: 'DiscGolfP Profile', text: shareText, url: shareUrl });
        toast({ title: 'Shared!', description: 'Your profile was shared successfully.' });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`.trim());
        toast({ title: 'Copied to clipboard', description: 'Share message copied.' });
      } else {
        // Fallback: prompt
        window.prompt('Copy your share message:', `${shareText}\n${shareUrl}`.trim());
      }
    } catch (err) {
      toast({ title: 'Share cancelled', description: 'Could not complete sharing.', variant: 'destructive' });
    }
  };

  const handleCopyUsername = async () => {
    if (!currentUser?.username) return;
    const handle = `@${currentUser.username}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(handle);
        toast({ title: 'Copied', description: `${handle} copied to clipboard` });
      } else {
        window.prompt('Copy username:', handle);
      }
    } catch (_) {
      toast({ title: 'Copy failed', description: 'Could not copy username', variant: 'destructive' });
    }
  };

  // Temporarily disabled for testing
  // if (!user || !currentUser) {
  //   return (
  //     <div className="p-4">
  //       <Card>
  //         <CardTitle>Sign in required</CardTitle>
  //         <CardDescription>
  //           Please sign in to manage your friends.
  //         </CardDescription>
  //       </Card>
  //     </div>
  //   );
  // }

  return (
    <div className="p-4 space-y-6 snap-start">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Friends</h1>
        <p className="text-[var(--muted-foreground)]">
          Connect with other disc golf players
        </p>
      </div>

      {/* Username Setup */}
      {currentUser && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback>
                    {user?.fullName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-base font-semibold truncate">
                    {user?.fullName || 'Your Name'}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {currentUser.username ? `@${currentUser.username}` : 'No username yet'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyUsername}
                  aria-label="Copy username"
                  disabled={!currentUser?.username}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShareProfile}
                  aria-label="Share your profile"
                >
                  <Share className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {currentUser.username ? null : (
            <CardContent>
              <form onSubmit={handleUpdateUsername} className="space-y-4">
                <div>
                  <Label htmlFor="myUsername">Choose a username</Label>
                  <Input
                    id="myUsername"
                    placeholder="@username"
                    value={myUsername}
                    onChange={(e) => setMyUsername(e.target.value)}
                    required
                  />
                  {myUsername && checkMyUsername && (
                    <div className="text-sm mt-1">
                      {checkMyUsername.exists ? (
                        <span className="text-red-600">✗ Username already taken</span>
                      ) : (
                        <span className="text-green-600">✓ Username available</span>
                      )}
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={isUpdatingUsername || !myUsername || checkMyUsername?.exists}
                >
                  {isUpdatingUsername ? 'Setting...' : 'Set Username'}
                </Button>
              </form>
            </CardContent>
          )}
        </Card>
      )}

      {/* Invite Friend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Invite Friend
            <UserPlus className="w-5 h-5 text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Unified Invite */}
          <div>
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="relative">
                <Input
                  id="invite-input"
                  placeholder="Add a friend by email or username"
                  value={inviteQuery}
                  onChange={(e) => setInviteQuery(e.target.value)}
                  required
                />
                {inviteQuery && !isEmailInput && (
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    {(!debouncedUsername) ? (
                      <Search className="w-4 h-4 text-muted-foreground" />
                    ) : (checkUserByUsername === undefined) ? (
                      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    ) : checkUserByUsername?.exists ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                )}
              </div>
              {inviteQuery && !isEmailInput && (
                <div className="text-sm mt-1 min-h-[1rem]">
                  {checkUserByUsername?.exists === false ? (
                    <span className="text-red-600">User not found</span>
                  ) : checkUserByUsername?.exists === true ? (
                    <span className="text-green-600">User found: {checkUserByUsername.user?.name || checkUserByUsername.user?.email}</span>
                  ) : debouncedUsername ? (
                    <span className="text-muted-foreground">Searching…</span>
                  ) : null}
                </div>
              )}
              <Button
                type="submit"
                disabled={
                  isInviting || (!isEmailInput && (!!debouncedUsername && checkUserByUsername?.exists === false))
                }
              >
                {isInviting ? 'Sending…' : 'Send request'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>
              Friend requests waiting for your response
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={request.requester?.image || ''} />
                      <AvatarFallback>
                        {request.requester?.name?.charAt(0) || request.requester?.email?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {request.requester?.name || request.requester?.email}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Wants to be your friend
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptFriend(request._id)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectFriend(request._id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

          {/* Friends List */}
          <Card className="snap-start">
            <CardHeader>
              <CardTitle>My Friends</CardTitle>
              <CardDescription>
                {friends?.length || 0} friends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {friends && friends.length > 0 ? (
                <div className="max-h-64 overflow-y-auto snap-y snap-mandatory space-y-3">
                  {friends.map((friend) => (
                friend && (
                  <div
                    key={friend._id}
                    className="flex items-center gap-3 p-3 border rounded-lg snap-start"
                  >
                    <Avatar>
                      <AvatarImage src={friend.image || ''} />
                      <AvatarFallback>
                        {friend.name?.charAt(0) || friend.email?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">
                        {friend.username || friend.name || friend.email}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {friend.username && `@${friend.username}`} {friend.email}
                      </div>
                    </div>
                    <Badge variant="secondary">Friend</Badge>
                  </div>
                )
              ))}
                </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No friends yet. Invite someone to get started!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      {leaderboard && leaderboard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Friend Leaderboard</CardTitle>
            <CardDescription>
              Average scores of all players
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((entry, index) => (
                entry && (
                  <div
                    key={entry.userId || `entry-${index}`}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <Avatar>
                        <AvatarFallback>
                          {entry.name?.charAt(0) || entry.username?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {entry.name || entry.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.totalRounds} rounds
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {entry.averageScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">avg</div>
                    </div>
                  </div>
                )
              ))}
        </div>
          </CardContent>
        </Card>
      )}
      </div>
  );
}