const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const signalCooldown = new Map();
const COOLDOWN_MINUTES = 30;

export default async function handler(req, res) {
  // CORS 設置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signalData = req.body;
    
    // 檢查冷卻期
    const cooldownKey = `${signalData.strategy}_${signalData.symbol}`;
    if (!checkCooldown(cooldownKey)) {
      return res.status(200).json({ success: true, message: 'Signal ignored (cooldown)' });
    }
    
    // 構建消息並發送到 Telegram
    const message = formatSignalMessage(signalData);
    await sendToTelegram(message);
    
    // 更新冷卻時間
    updateCooldown(cooldownKey);
    
    res.status(200).json({ 
      success: true, 
      message: 'Signal sent successfully'
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}

function checkCooldown(key) {
  const lastSignal = signalCooldown.get(key);
  if (!lastSignal) return true;
  return (Date.now() - lastSignal) > COOLDOWN_MINUTES * 60 * 1000;
}

function updateCooldown(key) {
  signalCooldown.set(key, Date.now());
}

function formatSignalMessage(data) {
  const { strategy = '未知策略', symbol = '未知', direction = '未知', price = '未知' } = data;
  
  return `🚀 交易信號\n策略: ${strategy}\n交易對: ${symbol}\n方向: ${direction}\n價格: ${price}`;
}

async function sendToTelegram(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    })
  });
}
