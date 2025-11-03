export default async function handler(req, res) {
  // 設置 CORS 頭部
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // 處理 OPTIONS 請求（CORS 預檢）
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只接受 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['POST']
    });
  }

  try {
    console.log('✅ 收到 Webhook 請求');
    
    const signalData = req.body;
    console.log('請求數據:', JSON.stringify(signalData, null, 2));

    // 簡單響應測試
    const testResponse = {
      success: true,
      message: 'Webhook 接收成功!',
      received: signalData,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    console.log('發送響應:', testResponse);
    
    return res.status(200).json(testResponse);
    
  } catch (error) {
    console.error('❌ 處理請求時出錯:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
