// 極簡版本 - 先確保基礎功能正常
export default async function handler(req, res) {
  console.log('收到請求:', req.method, req.url);
  
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      message: 'Webhook 服務正常運行',
      timestamp: new Date().toISOString(),
      path: '/api/webhook'
    });
  }
  
  if (req.method === 'POST') {
    try {
      const body = req.body;
      console.log('POST 數據:', body);
      
      return res.status(200).json({
        success: true,
        message: '請求接收成功',
        received: body,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        error: '處理請求時出錯',
        message: error.message
      });
    }
  }
  
  return res.status(405).json({
    error: '方法不允許',
    allowed: ['GET', 'POST']
  });
}
