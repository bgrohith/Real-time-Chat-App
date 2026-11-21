const User = require('../models/User');

// @desc    Search users by username or email
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    const search = req.query.search || '';
    const currentUserId = req.user._id;

    let query = { _id: { $ne: currentUserId } };

    if (search.trim()) {
      query.$or = [
        { username: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(30)
      .sort({ username: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error while searching users' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { statusMessage, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (statusMessage !== undefined) user.statusMessage = statusMessage;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

module.exports = {
  getUsers,
  updateProfile
};
