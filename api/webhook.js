// 導入所需模塊
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// 冷卻機制 - 避免重複信號
const signalCooldown = new Map();
const COOLDOWN_MINUTES = 30;

export default async function handler(req, res) {
  // 只接受POST請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('收到Webhook請求:', JSON.stringify(req.body, null, 2));
    
    const signalData = req.body;
    
    // 檢查冷卻期
    const cooldownKey = `${signalData.strategy}_${signalData.symbol}`;
    if (!checkCooldown(cooldownKey)) {
      console.log(`信號在冷卻期內: ${cooldownKey}`);
      return res.status(200).json({ success: true, message: 'Signal ignored (cooldown)' });
    }
    
    // 構建Telegram消息
    const message = formatSignalMessage(signalData);
    
    // 發送到Telegram
    await sendToTelegram(message);
    
    // 更新冷卻時間
    updateCooldown(cooldownKey);
    
    res.status(200).json({ 
      success: true, 
      message: 'Signal sent successfully',
      cooldown: COOLDOWN_MINUTES
    });
    
  } catch (error) {
    console.error('處理Webhook時出錯:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// 檢查冷卻期
function checkCooldown(key) {
  const lastSignal = signalCooldown.get(key);
  if (!lastSignal) return true;
  
  const now = Date.now();
  const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
  
  return (now - lastSignal) > cooldownMs;
}

// 更新冷卻時間
function updateCooldown(key) {
  signalCooldown.set(key, Date.now());
}

// 格式化信號消息
function formatSignalMessage(data) {
  const { 
    strategy = '未知策略',
    symbol = '未知交易對', 
    direction = '未知方向', 
    price = '未知價格',
    timestamp = new Date().toISOString(),
    timeframe = '未知時間框架',
    confidence = '中等'
  } = data;

  // 策略對應的表情符號
  const strategyEmojis = {
    '高時間框架順勢': '🚀',
    'Unicorn': '🦄',
    'Turtle Soup': '🐢',
    'default': '📊'
  };

  const emoji = strategyEmojis[strategy] || strategyEmojis.default;
  
  // 方向對應的箭頭
  const directionArrow = direction.toLowerCase().includes('buy') ? '📈' : 
                        direction.toLowerCase().includes('sell') ? '📉' : '➡️';
  
  // 格式化時間
  const timeString = new Date(timestamp).toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // 構建消息
  let message = `${emoji} **交易信號通知** ${emoji}\n\n`;
  message += `🏷 **策略**: ${strategy}\n`;
  message += `💱 **交易對**: ${symbol}\n`;
  message += `${directionArrow} **方向**: ${direction}\n`;
  message += `💰 **價格**: ${price}\n`;
  message += `⏰ **時間**: ${timeString}\n`;
  message += `📊 **時間框架**: ${timeframe}\n`;
  message += `🎯 **信心程度**: ${confidence}\n\n`;
  
  message += `🔒 **風控參數**\n`;
  message += `├ 止損: 1%\n`;
  message += `├ 止盈: 2%\n`;
  message += `├ 倉位: 總資金2%\n`;
  message += `└ 冷卻期: ${COOLDOWN_MINUTES}分鐘\n\n`;
  
  message += `💡 **操作建議**\n`;
  
  if (strategy.includes('高時間框架')) {
    message += `- 確認1小時趨勢方向\n`;
    message += `- 在5分鐘圖表進場\n`;
    message += `- 使用1:2風險報酬比\n`;
  } else if (strategy.includes('Unicorn')) {
    message += `- 等待價格回踩價值區域\n`;
    message += `- 確認BK+FVG重疊\n`;
    message += `- 設置緊密止損\n`;
  } else if (strategy.includes('Turtle')) {
    message += `- 確認假動作完成\n`;
    message += `- 等待反轉確認信號\n`;
    message += `- 快速進場，緊密止損\n`;
  }
  
  message += `\n⚠️ **風險提示**: 市場有風險，投資需謹慎`;
  
  return message;
}

// 發送到Telegram
async function sendToTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error('Telegram配置缺失，請檢查環境變量');
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    console.error('Telegram API錯誤:', result);
    throw new Error(`Telegram API錯誤: ${result.description || response.status}`);
  }
  
  console.log('消息發送成功:', result);
  return result;
}