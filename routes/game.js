const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Ride = require('../models/Ride');

// Получить данные игрока
router.get('/player', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Совершить поездку
router.post('/ride', auth, async (req, res) => {
  const { mode } = req.body;
  
  const missions = {
    normal: { xp: 45, coins: 60 },
    quest: { xp: 120, coins: 80 },
    explore: { xp: 100, coins: 90 },
    challenge: { xp: 150, coins: 70 }
  };
  
  let mission = missions[mode];
  let gainedXP = mission.xp;
  let gainedCoins = mission.coins;
  let bonusApplied = false;
  
  try {
    const user = await User.findById(req.user.userId);
    
    // Специальные механики
    if (mode === 'explore' && user.zonesUnlocked < 12) {
      user.zonesUnlocked++;
      bonusApplied = true;
      if (user.zonesUnlocked === 5) {
        user.coins += 100;
        gainedCoins += 100;
      }
      if (user.zonesUnlocked === 12) {
        user.gems += 50;
        user.achievements.set('Легенда города', true);
      }
    }
    
    if (mode === 'challenge' && Math.random() > 0.4) {
      gainedXP += 55;
      gainedCoins += 45;
      bonusApplied = true;
    }
    
    if (mode === 'quest' && Math.random() < 0.35) {
      gainedXP += 70;
      gainedCoins += 60;
      bonusApplied = true;
    }
    
    // Обновление статистики
    user.xp += gainedXP;
    user.coins += gainedCoins;
    user.rides++;
    
    // Проверка уровня
    let levelUp = false;
    const getXpForNextLevel = (level) => Math.floor(300 + (level - 1) * 80);
    
    while (user.xp >= getXpForNextLevel(user.level)) {
      user.xp -= getXpForNextLevel(user.level);
      user.level++;
      levelUp = true;
      user.gems += 20;
    }
    
    // Проверка достижений
    if (user.rides >= 5) user.achievements.set('Ночной гонщик', true);
    if (user.rides >= 10) user.achievements.set('Кофейный мастер', true);
    if (user.rides >= 100) user.achievements.set('100 поездок', true);
    if (user.zonesUnlocked >= 3) user.achievements.set('Первооткрыватель', true);
    
    await user.save();
    
    // Сохраняем поездку
    const ride = new Ride({
      userId: user._id,
      mode,
      xpGained: gainedXP,
      coinsGained: gainedCoins,
      bonusApplied
    });
    await ride.save();
    
    res.json({
      success: true,
      gainedXP,
      gainedCoins,
      levelUp,
      user: {
        level: user.level,
        xp: user.xp,
        coins: user.coins,
        gems: user.gems,
        rides: user.rides,
        zonesUnlocked: user.zonesUnlocked,
        achievements: user.achievements
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить скин
router.post('/skin', auth, async (req, res) => {
  const { skin } = req.body;
  
  try {
    const user = await User.findById(req.user.userId);
    user.skin = skin;
    await user.save();
    res.json({ success: true, skin: user.skin });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Купить предмет
router.post('/buy', auth, async (req, res) => {
  const { itemId } = req.body;
  
  const items = {
    'xp_boost': { price: 200, type: 'boost' },
    'coins_500': { price: 50, type: 'coins', amount: 500 },
    'skin_custom': { price: 300, type: 'skin' }
  };
  
  const item = items[itemId];
  if (!item) {
    return res.status(400).json({ message: 'Предмет не найден' });
  }
  
  try {
    const user = await User.findById(req.user.userId);
    
    if (user.coins < item.price) {
      return res.status(400).json({ message: 'Недостаточно монет' });
    }
    
    user.coins -= item.price;
    
    if (item.type === 'coins') {
      user.coins += item.amount;
    }
    
    await user.save();
    
    res.json({ success: true, coins: user.coins });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;