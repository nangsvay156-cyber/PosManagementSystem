
// Escape HTML characters for Telegram HTML parse mode
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  })[char]);
}

// LOW STOCK / OUT OF STOCK notification
const sendLowStockAlert = async (product) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();

  if (!botToken || !chatId) {
    throw new Error('Telegram configuration is missing.');
  }

  const stock = Number(product.stock);
  const threshold = Number(product.threshold);
  const unit = product.unit || 'pcs';
  const userName = product.userName || 'Unknown User';

  const stockStatus = stock <= 0
    ? '🔴 OUT OF STOCK'
    : '⚠️ LOW STOCK';

  const message = `
<b>🏪 POS INVENTORY SYSTEM</b>
<i>Inventory Management Notification</i>

━━━━━━━━━━━━━━━━━━

${stockStatus}

<b>📦 PRODUCT INFORMATION</b>

<b>Product:</b> ${escapeHtml(product.name)}
<b>SKU:</b> ${escapeHtml(product.sku)}
<b>Unit:</b> ${escapeHtml(unit)}

━━━━━━━━━━━━━━━━━━

<b>📊 STOCK INFORMATION</b>

<b>Remaining Stock:</b> ${stock} ${escapeHtml(unit)}
<b>Alert Threshold:</b> ${threshold} ${escapeHtml(unit)}

━━━━━━━━━━━━━━━━━━

<b>👤 USER INFORMATION</b>

<b>Triggered By:</b> ${escapeHtml(userName)}

━━━━━━━━━━━━━━━━━━

<b>🚨 ACTION REQUIRED</b>

${stock <= 0
    ? 'This product is out of stock. Please restock immediately.'
    : 'Stock is below or equal to the minimum level. Please arrange a restock.'}

<i>Automated notification from POS System.</i>
  `.trim();

  return sendTelegramMessage(botToken, chatId, message, product.name);
};

// STOCK IN / STOCK OUT notification
const sendStockAdjustmentAlert = async (product) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();

  if (!botToken || !chatId) {
    throw new Error('Telegram configuration is missing.');
  }

  const stockBefore = Number(product.stockBefore);
  const stockAfter = Number(product.stockAfter);
  const quantityChange = Number(product.quantityChange);
  const unit = product.unit || 'pcs';
  const userName = product.userName || 'Unknown User';

  const isStockIn = quantityChange > 0;

  const adjustmentStatus = isStockIn
    ? '🟢 STOCK IN'
    : '🟠 STOCK OUT';

  const message = `
<b>🏪 POS INVENTORY SYSTEM</b>
<i>Inventory Management Notification</i>

━━━━━━━━━━━━━━━━━━

${adjustmentStatus}

<b>📦 PRODUCT INFORMATION</b>

<b>Product:</b> ${escapeHtml(product.name)}
<b>SKU:</b> ${escapeHtml(product.sku)}
<b>Unit:</b> ${escapeHtml(unit)}

━━━━━━━━━━━━━━━━━━

<b>📊 STOCK ADJUSTMENT</b>

<b>Stock Before:</b> ${stockBefore} ${escapeHtml(unit)}
<b>Quantity ${isStockIn ? 'Added' : 'Removed'}:</b> ${Math.abs(quantityChange)} ${escapeHtml(unit)}
<b>Stock After:</b> ${stockAfter} ${escapeHtml(unit)}

━━━━━━━━━━━━━━━━━━

<b>👤 USER INFORMATION</b>

<b>Adjusted By:</b> ${escapeHtml(userName)}
<b>Note:</b> ${escapeHtml(product.note || 'Manual stock adjustment')}

<i>Automated notification from POS System.</i>
  `.trim();

  return sendTelegramMessage(botToken, chatId, message, product.name);
};

// Shared Telegram sender
async function sendTelegramMessage(botToken, chatId, message, productName) {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(8000),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result.description || 'Telegram notification failed.'
    );
  }

  console.log('Telegram notification sent:', productName);

  return result;
}

module.exports = {
  sendLowStockAlert,
  sendStockAdjustmentAlert,
};