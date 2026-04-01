const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Получить топ игроков
router.get('/', async (req, res) => {
  try {
    const leaders = await User.find()
      .sort({ xp: -1 })
      .limit(10)
      .select('username level xp rides');
    
    res.json(leaders);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить позицию игрока
router.get('/position/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    const count = await User.countDocuments({ xp: { $gt: user.xp } });
    const position = count + 1;
    
    res.json({ position });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;