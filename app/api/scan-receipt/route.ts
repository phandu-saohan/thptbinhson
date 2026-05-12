import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình GEMINI_API_KEY' }, { status: 500 });
    }

    const prompt = `Đây là ảnh biên lai chuyển khoản.
NHIỆM VỤ BẮT BUỘC: Bạn CHỈ ĐƯỢC PHÉP in ra ĐÚNG MỘT CON SỐ DUY NHẤT là số tiền.
TUYỆT ĐỐI KHÔNG giải thích, KHÔNG nói "Here is...", KHÔNG thêm dấu chấm phẩy.
Ví dụ nếu số tiền là 2,000,000 VND -> in ra: 2000000`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "You are a precise data extractor. You must output ONLY digits. Do not output any conversational text like 'Here is the JSON'." }]
          },
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64 } }
            ]
          }],
          generationConfig: {
            temperature: 0.0,
            maxOutputTokens: 256,
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini error:', errText);
      return NextResponse.json(
        { error: `Gemini API lỗi ${response.status}: ${errText.slice(0, 300)}` },
        { status: response.status }
      );
    }

    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      console.error('Gemini returned empty text. Full response:', JSON.stringify(json));
      return NextResponse.json({ 
        error: 'AI không nhận diện được văn bản trong ảnh (có thể do lỗi an toàn hoặc ảnh không rõ)', 
        details: json 
      }, { status: 422 });
    }

    // Trích xuất trực tiếp bằng Regex (bỏ qua JSON parse để tránh lỗi do AI tự ý thay đổi định dạng)
    let amountStr = '';
    const numMatch = text.match(/\d[\d.,]*/);
    if (numMatch) {
      amountStr = numMatch[0].replace(/[.,]/g, '');
    }

    if (!amountStr) {
      return NextResponse.json({ error: `AI không đọc được số tiền. Phản hồi gốc: "${text}"` }, { status: 422 });
    }

    return NextResponse.json({ success: true, data: { amount: amountStr } });

  } catch (err: any) {
    console.error('scan-receipt error:', err);
    return NextResponse.json({ error: err.message || 'Lỗi server' }, { status: 500 });
  }
}
