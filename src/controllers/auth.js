const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { Notification } = require('../models/index');

const signToken = (id, secret, expire) =>
  jwt.sign({ id }, secret || 'secret', { expiresIn: expire || '15m' });

const sendTokens = (user, statusCode, res) => {
  const accessToken = signToken(user._id, process.env.JWT_SECRET, process.env.JWT_EXPIRE);
  const refreshToken = signToken(user._id, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRE);

  user.refreshToken = refreshToken;
  user.save({ validateBeforeSave: false });

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.nickname,
      memberNumber: user.memberNumber,
      avatar: user.avatar,
      role: user.role,
      stats: user.stats,
      badges: user.badges
    }
  });
};

exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, nickname } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Bu email zaten kayıtlı.' });

    const user = await User.create({ email, password, firstName, lastName, nickname });
    
    // Welcome notification
    await Notification.create({
      recipient: user._id,
      type: 'announcement',
      title: '🏍️ MotoGrup\'a Hoş Geldiniz!',
      message: `Merhaba ${user.firstName}! MotoGrup ailesine katıldığınız için teşekkürler.`
    });

    sendTokens(user, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email ve şifre gerekli.' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Email veya şifre hatalı.' });
    }
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Hesabınız devre dışı.' });

    user.lastSeen = Date.now();
    sendTokens(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token gerekli.' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret');
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Geçersiz refresh token.' });
    }

    sendTokens(user, 200, res);
  } catch (err) {
    res.status(401).json({ success: false, message: 'Refresh token geçersiz veya süresi doldu.' });
  }
};

exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ success: true, message: 'Çıkış yapıldı.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ success: false, message: 'Bu email ile kayıtlı hesap bulunamadı.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // In production, send email
    console.log(`Password reset token: ${token}`);
    res.json({ success: true, message: 'Şifre sıfırlama bağlantısı email adresinize gönderildi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ success: false, message: 'Token geçersiz veya süresi doldu.' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokens(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('following', 'firstName lastName nickname avatar')
    .populate('followers', 'firstName lastName nickname avatar');
  res.json({ success: true, data: user });
};
