import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json();

    const systemMessage = {
      role: 'system' as const,
      content: `Sen Defterli adlı bir fatura arşiv sistemi için yardımcı bir AI asistanısın. Aşağıdaki sistem bilgilerini kullanarak kullanıcılara yardımcı ol:

${context}

Kullanıcılara Türkçe, samimi ve yardımcı bir şekilde yanıt ver. Kısa ve öz cevaplar ver, gerektiğinde adım adım açıkla.`,
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      content: response.choices[0]?.message?.content || 'Üzgünüm, bir yanıt oluşturamadım.',
    });
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Bir hata oluştu',
        content: 'Üzgünüm, bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
      },
      { status: 500 }
    );
  }
}

