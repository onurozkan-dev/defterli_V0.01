import { NextRequest, NextResponse } from 'next/server';

const GIFT_CODES = process.env.GIFT_CODES
  ? process.env.GIFT_CODES.split(',').map((code) => code.trim())
  : [];

export async function POST(request: NextRequest) {
  try {
    const { code, userId, userData } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { error: 'Eksik parametreler' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase().trim();
    if (!GIFT_CODES.includes(normalizedCode)) {
      return NextResponse.json(
        { error: 'Geçersiz hediye kodu' },
        { status: 400 }
      );
    }

    if (!userData) {
      return NextResponse.json(
        { error: 'Kullanıcı bilgileri bulunamadı. Lütfen sayfayı yenileyin.' },
        { status: 400 }
      );
    }

    if (userData.giftCodeUsed) {
      return NextResponse.json(
        { error: 'Bu hediye kodunu daha önce kullandınız' },
        { status: 400 }
      );
    }

    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);
    return NextResponse.json({
      success: true,
      message: '1 haftalık sınırsız üyelik kazandınız!',
      trialExpiresAt: trialExpiresAt.toISOString(),
      userId: userId,
    });
  } catch (error: any) {
    console.error('Gift code error:', error);
    return NextResponse.json(
      { error: error.message || 'Hediye kodu işlenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

