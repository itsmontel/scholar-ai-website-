const { createClient } = require('@supabase/supabase-js');
const subscriptionService = require('./subscriptionService');

class FriendsService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );
  }

  /**
   * Get user's friend code
   */
  async getFriendCode(userId) {
    const { data, error } = await this.supabase
      .from('users')
      .select('friend_code')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching friend code:', error);
      throw error;
    }

    return data?.friend_code;
  }

  /**
   * Find user by friend code
   */
  async findUserByFriendCode(friendCode) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, first_name, last_name, email, friend_code')
      .eq('friend_code', friendCode.toUpperCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding user by friend code:', error);
      throw error;
    }

    return data;
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(userId, friendCode) {
    const friend = await this.findUserByFriendCode(friendCode);
    
    if (!friend) {
      throw new Error('No user found with that friend code');
    }

    if (friend.id === userId) {
      throw new Error('You cannot add yourself as a friend');
    }

    // Check if the target user has blocked the sender
    const isBlocked = await this.isBlocked(friend.id, userId);
    if (isBlocked) {
      throw new Error('Unable to send friend request to this user');
    }

    // Check if the sender has blocked the target (prevent adding someone you blocked)
    const hasBlocked = await this.isBlocked(userId, friend.id);
    if (hasBlocked) {
      throw new Error('You have blocked this user. Unblock them first to send a friend request.');
    }

    const existingFriendship = await this.checkExistingFriendship(userId, friend.id);
    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        throw new Error('You are already friends with this user');
      }
      if (existingFriendship.status === 'pending') {
        throw new Error('A friend request is already pending');
      }
      // Status is 'declined' - update to 'pending' instead of inserting (avoids unique constraint)
      const { data: updatedData, error: updateError } = await this.supabase
        .from('friends')
        .update({ status: 'pending' })
        .eq('id', existingFriendship.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error re-sending friend request:', updateError);
        throw updateError;
      }

      await this.createFriendNotification(friend.id, userId, 'friend_request');
      return { message: 'Friend request sent!', request: updatedData };
    }

    const reverseRequest = await this.checkExistingFriendship(friend.id, userId);
    if (reverseRequest && reverseRequest.status === 'pending') {
      await this.acceptFriendRequest(userId, reverseRequest.id);
      return { message: 'Friend request accepted! You are now friends.', autoAccepted: true };
    }
    // If reverse request was declined, delete it so we can send fresh request from our side
    if (reverseRequest && reverseRequest.status === 'declined') {
      await this.supabase
        .from('friends')
        .delete()
        .eq('id', reverseRequest.id);
    }

    const { data, error } = await this.supabase
      .from('friends')
      .insert({
        user_id: userId,
        friend_id: friend.id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }

    await this.createFriendNotification(friend.id, userId, 'friend_request');

    return { message: 'Friend request sent!', request: data };
  }

  /**
   * Check if friendship exists between two users
   */
  async checkExistingFriendship(userId, friendId) {
    const { data, error } = await this.supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId)
      .eq('friend_id', friendId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking friendship:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get all friends for a user (accepted friendships)
   */
  async getFriends(userId) {
    const { data: sentRequests, error: sentError } = await this.supabase
      .from('friends')
      .select(`
        id,
        status,
        created_at,
        friend:friend_id (
          id,
          username,
          first_name,
          last_name,
          email,
          friend_code
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (sentError) {
      console.error('Error fetching sent friendships:', sentError);
      throw sentError;
    }

    const { data: receivedRequests, error: receivedError } = await this.supabase
      .from('friends')
      .select(`
        id,
        status,
        created_at,
        friend:user_id (
          id,
          username,
          first_name,
          last_name,
          email,
          friend_code
        )
      `)
      .eq('friend_id', userId)
      .eq('status', 'accepted');

    if (receivedError) {
      console.error('Error fetching received friendships:', receivedError);
      throw receivedError;
    }

    const friends = [
      ...sentRequests.map(r => ({ ...r.friend, friendshipId: r.id, since: r.created_at })),
      ...receivedRequests.map(r => ({ ...r.friend, friendshipId: r.id, since: r.created_at }))
    ];

    return friends;
  }

  /**
   * Get pending friend requests (received)
   */
  async getPendingRequests(userId) {
    const { data, error } = await this.supabase
      .from('friends')
      .select(`
        id,
        status,
        created_at,
        sender:user_id (
          id,
          username,
          first_name,
          last_name,
          email,
          friend_code
        )
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending requests:', error);
      throw error;
    }

    return data.map(r => ({
      id: r.id,
      sender: r.sender,
      createdAt: r.created_at
    }));
  }

  /**
   * Get sent friend requests (pending)
   */
  async getSentRequests(userId) {
    const { data, error } = await this.supabase
      .from('friends')
      .select(`
        id,
        status,
        created_at,
        recipient:friend_id (
          id,
          username,
          first_name,
          last_name,
          email,
          friend_code
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sent requests:', error);
      throw error;
    }

    return data.map(r => ({
      id: r.id,
      recipient: r.recipient,
      createdAt: r.created_at
    }));
  }

  /**
   * Accept friend request
   */
  async acceptFriendRequest(userId, requestId) {
    const { data: request, error: fetchError } = await this.supabase
      .from('friends')
      .select('*')
      .eq('id', requestId)
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !request) {
      throw new Error('Friend request not found');
    }

    const { data, error } = await this.supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }

    await this.createFriendNotification(request.user_id, userId, 'friend_accepted');

    return data;
  }

  /**
   * Decline friend request
   */
  async declineFriendRequest(userId, requestId) {
    const { data: request, error: fetchError } = await this.supabase
      .from('friends')
      .select('*')
      .eq('id', requestId)
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !request) {
      throw new Error('Friend request not found');
    }

    const { error } = await this.supabase
      .from('friends')
      .update({ status: 'declined' })
      .eq('id', requestId);

    if (error) {
      console.error('Error declining friend request:', error);
      throw error;
    }

    return { success: true };
  }

  /**
   * Remove friend
   */
  async removeFriend(userId, friendId) {
    const { error: error1 } = await this.supabase
      .from('friends')
      .delete()
      .eq('user_id', userId)
      .eq('friend_id', friendId);

    const { error: error2 } = await this.supabase
      .from('friends')
      .delete()
      .eq('user_id', friendId)
      .eq('friend_id', userId);

    if (error1 && error2) {
      console.error('Error removing friend:', error1, error2);
      throw new Error('Failed to remove friend');
    }

    return { success: true };
  }

  /**
   * Block a user (also removes friendship if exists)
   */
  async blockUser(blockerId, blockedId) {
    if (blockerId === blockedId) {
      throw new Error('You cannot block yourself');
    }

    // Check if already blocked
    const { data: existingBlock } = await this.supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
      .single();

    if (existingBlock) {
      throw new Error('User is already blocked');
    }

    // Remove any existing friendship first
    await this.removeFriend(blockerId, blockedId).catch(() => {});

    // Remove any pending friend requests
    await this.supabase
      .from('friends')
      .delete()
      .eq('user_id', blockerId)
      .eq('friend_id', blockedId);

    await this.supabase
      .from('friends')
      .delete()
      .eq('user_id', blockedId)
      .eq('friend_id', blockerId);

    // Add to blocked_users table
    const { data, error } = await this.supabase
      .from('blocked_users')
      .insert({
        blocker_id: blockerId,
        blocked_id: blockedId
      })
      .select()
      .single();

    if (error) {
      console.error('Error blocking user:', error);
      throw new Error('Failed to block user');
    }

    console.log(`User ${blockerId} blocked user ${blockedId}`);
    return { success: true, message: 'User blocked' };
  }

  /**
   * Unblock a user
   */
  async unblockUser(blockerId, blockedId) {
    const { data, error } = await this.supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
      .select();

    if (error) {
      console.error('Error unblocking user:', error);
      throw new Error('Failed to unblock user');
    }

    if (!data || data.length === 0) {
      throw new Error('User is not blocked');
    }

    console.log(`User ${blockerId} unblocked user ${blockedId}`);
    return { success: true, message: 'User unblocked' };
  }

  /**
   * Check if a user is blocked by another user
   */
  async isBlocked(blockerId, blockedId) {
    const { data, error } = await this.supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking block status:', error);
      return false;
    }

    return !!data;
  }

  /**
   * Get list of users blocked by a user
   */
  async getBlockedUsers(userId) {
    const { data, error } = await this.supabase
      .from('blocked_users')
      .select(`
        id,
        created_at,
        blocked:blocked_id (
          id,
          username,
          first_name,
          last_name,
          email,
          friend_code
        )
      `)
      .eq('blocker_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blocked users:', error);
      throw error;
    }

    return data.map(b => ({
      id: b.id,
      blockedAt: b.created_at,
      user: b.blocked
    }));
  }

  /**
   * Share a quiz/flashcard/crossword with a friend
   */
  async shareWithFriend(senderId, receiverId, quizId, message = null) {
    const isFriend = await this.areFriends(senderId, receiverId);
    if (!isFriend) {
      throw new Error('You can only share with friends');
    }

    const { data: quiz, error: quizError } = await this.supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('user_id', senderId)
      .single();

    if (quizError || !quiz) {
      throw new Error('Quiz not found or you do not own it');
    }

    const { data: existingShare } = await this.supabase
      .from('friend_share_requests')
      .select('id, status')
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .eq('quiz_id', quizId)
      .eq('status', 'pending')
      .single();

    if (existingShare) {
      throw new Error('You have already shared this item with this friend');
    }

    const { data, error } = await this.supabase
      .from('friend_share_requests')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        quiz_id: quizId,
        message,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating share request:', error);
      throw error;
    }

    await this.createShareNotification(receiverId, senderId, quiz, data.id);

    return { message: 'Shared successfully!', shareRequest: data };
  }

  /**
   * Check if two users are friends
   */
  async areFriends(userId1, userId2) {
    const { data, error } = await this.supabase
      .from('friends')
      .select('id')
      .or(`and(user_id.eq.${userId1},friend_id.eq.${userId2}),and(user_id.eq.${userId2},friend_id.eq.${userId1})`)
      .eq('status', 'accepted')
      .limit(1);

    if (error) {
      console.error('Error checking friendship:', error);
      return false;
    }

    return data && data.length > 0;
  }

  /**
   * Get incoming share requests
   */
  async getIncomingShareRequests(userId) {
    const { data, error } = await this.supabase
      .from('friend_share_requests')
      .select(`
        id,
        message,
        status,
        created_at,
        sender:sender_id (
          id,
          username,
          first_name,
          last_name,
          email
        ),
        quiz:quiz_id (
          id,
          title,
          quiz_type,
          difficulty,
          question_count
        )
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching share requests:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get sent share requests
   */
  async getSentShareRequests(userId) {
    const { data, error } = await this.supabase
      .from('friend_share_requests')
      .select(`
        id,
        message,
        status,
        created_at,
        receiver:receiver_id (
          id,
          username,
          first_name,
          last_name,
          email
        ),
        quiz:quiz_id (
          id,
          title,
          quiz_type,
          difficulty,
          question_count
        )
      `)
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching sent share requests:', error);
      throw error;
    }

    return data;
  }

  /**
   * Accept share request (copies quiz to receiver's account)
   */
  async acceptShareRequest(userId, shareRequestId) {
    const { data: request, error: fetchError } = await this.supabase
      .from('friend_share_requests')
      .select(`
        *,
        quiz:quiz_id (*)
      `)
      .eq('id', shareRequestId)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !request) {
      throw new Error('Share request not found');
    }

    const originalQuiz = request.quiz;
    const userPlan = await subscriptionService.getUserPlan(userId);
    const isPaidUser = userPlan === 'starter' || userPlan === 'premium';
    const expiresAt = isPaidUser ? null : (() => {
      const now = new Date();
      const exp = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return exp.toISOString();
    })();

    const { data: newQuiz, error: copyError } = await this.supabase
      .from('quizzes')
      .insert({
        user_id: userId,
        title: `${originalQuiz.title} (shared)`,
        quiz_type: originalQuiz.quiz_type,
        difficulty: originalQuiz.difficulty,
        question_count: originalQuiz.question_count,
        questions: originalQuiz.questions,
        source_word_count: originalQuiz.source_word_count,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (copyError) {
      console.error('Error copying quiz:', copyError);
      throw new Error('Failed to copy shared content');
    }

    const { error: updateError } = await this.supabase
      .from('friend_share_requests')
      .update({ status: 'accepted' })
      .eq('id', shareRequestId);

    if (updateError) {
      console.error('Error updating share request:', updateError);
    }

    await this.createShareAcceptedNotification(request.sender_id, userId, originalQuiz);

    return { message: 'Content added to your library!', quiz: newQuiz };
  }

  /**
   * Decline share request
   */
  async declineShareRequest(userId, shareRequestId) {
    const { data: request, error: fetchError } = await this.supabase
      .from('friend_share_requests')
      .select('*')
      .eq('id', shareRequestId)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !request) {
      throw new Error('Share request not found');
    }

    const { error } = await this.supabase
      .from('friend_share_requests')
      .update({ status: 'declined' })
      .eq('id', shareRequestId);

    if (error) {
      console.error('Error declining share request:', error);
      throw error;
    }

    return { success: true };
  }

  /**
   * Create notification for friend request
   */
  async createFriendNotification(recipientId, senderId, type) {
    const { data: sender } = await this.supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', senderId)
      .single();

    const senderName = sender ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || 'Someone' : 'Someone';

    let title, message;
    if (type === 'friend_request') {
      title = 'New Friend Request';
      message = `${senderName} wants to be your friend!`;
    } else if (type === 'friend_accepted') {
      title = 'Friend Request Accepted';
      message = `${senderName} accepted your friend request!`;
    }

    await this.supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type,
        title,
        message,
        metadata: { sender_id: senderId }
      });
  }

  /**
   * Create notification for share request
   */
  async createShareNotification(recipientId, senderId, quiz, shareRequestId) {
    const { data: sender } = await this.supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', senderId)
      .single();

    const senderName = sender ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || 'Someone' : 'Someone';
    const itemType = this.getItemTypeName(quiz.quiz_type);

    await this.supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'friend_share_request',
        title: `${senderName} shared a ${itemType}`,
        message: `"${quiz.title}" - Accept to add it to your library!`,
        metadata: { 
          sender_id: senderId,
          quiz_id: quiz.id,
          share_request_id: shareRequestId,
          quiz_type: quiz.quiz_type
        }
      });
  }

  /**
   * Create notification when share is accepted
   */
  async createShareAcceptedNotification(recipientId, accepterId, quiz) {
    const { data: accepter } = await this.supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', accepterId)
      .single();

    const accepterName = accepter ? `${accepter.first_name || ''} ${accepter.last_name || ''}`.trim() || 'Someone' : 'Someone';
    const itemType = this.getItemTypeName(quiz.quiz_type);

    await this.supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'share_accepted',
        title: 'Share Accepted!',
        message: `${accepterName} accepted your shared ${itemType} "${quiz.title}"`,
        metadata: { 
          accepter_id: accepterId,
          quiz_id: quiz.id,
          quiz_type: quiz.quiz_type
        }
      });
  }

  getItemTypeName(quizType) {
    switch (quizType) {
      case 'flashcards': return 'flashcard set';
      case 'crossword': return 'crossword';
      case 'crater_blast': return 'Crater Blast game';
      default: return 'quiz';
    }
  }

  /**
   * Get counts for dashboard/badges
   */
  async getFriendCounts(userId) {
    const { data: friends } = await this.supabase
      .from('friends')
      .select('id')
      .or(`and(user_id.eq.${userId},status.eq.accepted),and(friend_id.eq.${userId},status.eq.accepted)`);

    const { data: pendingRequests } = await this.supabase
      .from('friends')
      .select('id')
      .eq('friend_id', userId)
      .eq('status', 'pending');

    const { data: shareRequests } = await this.supabase
      .from('friend_share_requests')
      .select('id')
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    return {
      friendCount: friends?.length || 0,
      pendingFriendRequests: pendingRequests?.length || 0,
      pendingShareRequests: shareRequests?.length || 0
    };
  }
}

module.exports = new FriendsService();
