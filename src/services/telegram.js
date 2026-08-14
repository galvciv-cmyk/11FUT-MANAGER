export async function enviarNotificacionTelegram(botToken, chatId, titulo, mensaje) {
  if (!botToken || !chatId) return false;
  
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const textoFormateado = `*${titulo}*\n${mensaje}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: textoFormateado,
        parse_mode: 'Markdown'
      })
    });
    
    if (response.ok) {
      console.log('Notificación de Telegram enviada con éxito');
      return true;
    } else {
      console.error('Error de API al enviar notificación de Telegram:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('Error de red al enviar notificación de Telegram:', error);
    return false;
  }
}
