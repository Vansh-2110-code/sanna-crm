const AuthService = require('../services/AuthService');

exports.login = async (req, res) => {
  try {
    const { email, username, identifier, password } = req.body;
    const userIdentifier = identifier || username || email;
    const result = await AuthService.login(userIdentifier, password);
    // Expose token both as 'token' (frontend key) and 'accessToken' (RFC naming)
    res.json({ ...result, token: result.accessToken });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refresh(refreshToken);
    res.json(result);
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
};

exports.signup = async (req, res) => {
  try {
    const result = await AuthService.signup(req.body);
    res.status(201).json({ ...result, token: result.accessToken });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const { userId } = req.body;
    await AuthService.logout(userId);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    const targetUserId = req.user?.userId || userId;
    const result = await AuthService.changePassword(targetUserId, currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
