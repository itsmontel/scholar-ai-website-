const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken } = require('../middleware/auth');
const friendsService = require('../services/friendsService');
const { computeStreakFromDates } = require('../services/streakService');

const router = express.Router();

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );
}

// @route   GET /api/friends/my-code
// @desc    Get current user's friend code
// @access  Private
router.get('/my-code', authenticateToken, async (req, res) => {
  try {
    const friendCode = await friendsService.getFriendCode(req.user.id);
    
    res.json({
      success: true,
      data: { friendCode }
    });
  } catch (error) {
    console.error('Get friend code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get friend code'
    });
  }
});

// @route   GET /api/friends/counts
// @desc    Get friend-related counts (for badges/dashboard)
// @access  Private
router.get('/counts', authenticateToken, async (req, res) => {
  try {
    const counts = await friendsService.getFriendCounts(req.user.id);
    
    res.json({
      success: true,
      data: counts
    });
  } catch (error) {
    console.error('Get friend counts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get friend counts'
    });
  }
});

// @route   GET /api/friends
// @desc    Get all friends (accepted)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const friends = await friendsService.getFriends(req.user.id);
    
    res.json({
      success: true,
      data: friends
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get friends'
    });
  }
});

// @route   GET /api/friends/streaks
// @desc    Get current streak for each friend
// @access  Private
router.get('/streaks', authenticateToken, async (req, res) => {
  try {
    const friends = await friendsService.getFriends(req.user.id);
    if (friends.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const friendIds = friends.map(f => f.id);
    const supabase = getSupabase();

    const { data: rows, error } = await supabase
      .from('user_login_dates')
      .select('user_id, login_date')
      .in('user_id', friendIds)
      .order('login_date', { ascending: false });

    if (error) throw error;

    const byUser = {};
    for (const r of rows || []) {
      if (!byUser[r.user_id]) byUser[r.user_id] = [];
      byUser[r.user_id].push(r.login_date);
    }

    const result = friendIds.map(userId => {
      const dates = byUser[userId] || [];
      const { currentStreak } = computeStreakFromDates(dates);
      return { userId, currentStreak };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get friend streaks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get friend streaks'
    });
  }
});

// @route   GET /api/friends/requests/pending
// @desc    Get pending friend requests (received)
// @access  Private
router.get('/requests/pending', authenticateToken, async (req, res) => {
  try {
    const requests = await friendsService.getPendingRequests(req.user.id);
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending requests'
    });
  }
});

// @route   GET /api/friends/requests/sent
// @desc    Get sent friend requests
// @access  Private
router.get('/requests/sent', authenticateToken, async (req, res) => {
  try {
    const requests = await friendsService.getSentRequests(req.user.id);
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sent requests'
    });
  }
});

// @route   POST /api/friends/add
// @desc    Send friend request by friend code
// @access  Private
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { friendCode } = req.body;
    
    if (!friendCode) {
      return res.status(400).json({
        success: false,
        message: 'Friend code is required'
      });
    }
    
    const result = await friendsService.sendFriendRequest(req.user.id, friendCode);
    
    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send friend request'
    });
  }
});

// @route   POST /api/friends/requests/:id/accept
// @desc    Accept a friend request
// @access  Private
router.post('/requests/:id/accept', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await friendsService.acceptFriendRequest(req.user.id, id);
    
    res.json({
      success: true,
      message: 'Friend request accepted!'
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to accept friend request'
    });
  }
});

// @route   POST /api/friends/requests/:id/decline
// @desc    Decline a friend request
// @access  Private
router.post('/requests/:id/decline', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await friendsService.declineFriendRequest(req.user.id, id);
    
    res.json({
      success: true,
      message: 'Friend request declined'
    });
  } catch (error) {
    console.error('Decline friend request error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to decline friend request'
    });
  }
});

// @route   DELETE /api/friends/:friendId
// @desc    Remove a friend
// @access  Private
router.delete('/:friendId', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    
    await friendsService.removeFriend(req.user.id, friendId);
    
    res.json({
      success: true,
      message: 'Friend removed'
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove friend'
    });
  }
});

// @route   POST /api/friends/block/:userId
// @desc    Block a user (also removes friendship)
// @access  Private
router.post('/block/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await friendsService.blockUser(req.user.id, userId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to block user'
    });
  }
});

// @route   POST /api/friends/unblock/:userId
// @desc    Unblock a user
// @access  Private
router.post('/unblock/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await friendsService.unblockUser(req.user.id, userId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to unblock user'
    });
  }
});

// @route   GET /api/friends/blocked
// @desc    Get list of blocked users
// @access  Private
router.get('/blocked', authenticateToken, async (req, res) => {
  try {
    const blockedUsers = await friendsService.getBlockedUsers(req.user.id);
    
    res.json({
      success: true,
      data: blockedUsers
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blocked users'
    });
  }
});

// @route   POST /api/friends/share
// @desc    Share a quiz/flashcard/crossword with a friend
// @access  Private
router.post('/share', authenticateToken, async (req, res) => {
  try {
    const { friendId, quizId, message } = req.body;
    
    if (!friendId || !quizId) {
      return res.status(400).json({
        success: false,
        message: 'Friend ID and Quiz ID are required'
      });
    }
    
    const result = await friendsService.shareWithFriend(req.user.id, friendId, quizId, message);
    
    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Share error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to share'
    });
  }
});

// @route   GET /api/friends/share-requests/incoming
// @desc    Get incoming share requests
// @access  Private
router.get('/share-requests/incoming', authenticateToken, async (req, res) => {
  try {
    const requests = await friendsService.getIncomingShareRequests(req.user.id);
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get incoming share requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get share requests'
    });
  }
});

// @route   GET /api/friends/share-requests/sent
// @desc    Get sent share requests
// @access  Private
router.get('/share-requests/sent', authenticateToken, async (req, res) => {
  try {
    const requests = await friendsService.getSentShareRequests(req.user.id);
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get sent share requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sent share requests'
    });
  }
});

// @route   POST /api/friends/share-requests/:id/accept
// @desc    Accept a share request (copies content to your library)
// @access  Private
router.post('/share-requests/:id/accept', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await friendsService.acceptShareRequest(req.user.id, id);
    
    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Accept share request error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to accept share request'
    });
  }
});

// @route   POST /api/friends/share-requests/:id/decline
// @desc    Decline a share request
// @access  Private
router.post('/share-requests/:id/decline', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await friendsService.declineShareRequest(req.user.id, id);
    
    res.json({
      success: true,
      message: 'Share request declined'
    });
  } catch (error) {
    console.error('Decline share request error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to decline share request'
    });
  }
});

module.exports = router;
