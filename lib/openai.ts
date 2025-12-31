export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function chatWithAI(
  messages: ChatMessage[],
  context: string
): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    return data.content || 'Üzgünüm, bir yanıt oluşturamadım.';
  } catch (error: any) {
    console.error('Chat API error:', error);
    return 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
  }
}

