import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình GEMINI_API_KEY' }, { status: 500 });
    }

    const prompt = `Đây là ảnh biên lai/screenshot chuyển khoản ngân hàng Việt Nam.
Nhiệm vụ: Chỉ đọc và trả về SỐ TIỀN đã chuyển khoản trong ảnh.

Quy tắc:
- Chỉ lấy con số, bỏ hết chữ "VND", "đồng", dấu chấm, dấu phẩy
- Ví dụ: "1.000.000" → "1000000", "500,000 VND" → "500000"
- Nếu không đọc được số tiền thì trả về chuỗi rỗng

Trả về JSON (không markdown, không giải thích):
{"amount": "1000000"}

CHỈ trả về JSON, không gì khác.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64 } }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 64,
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

    // Parse JSON từ response
    const cleaned = text.replace(/```json|```/g, '').trim();
    let parsed: { amount?: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Thử extract JSON từ text nếu có text thừa
      const match = cleaned.match(/\{[^}]+\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        // Thử lấy số trực tiếp từ text
        const numMatch = cleaned.match(/\d[\d.]*/);
        if (numMatch) {
          parsed = { amount: numMatch[0].replace(/\./g, '') };
        } else {
          return NextResponse.json({ error: 'AI không đọc được số tiền trong ảnh', raw: text }, { status: 422 });
        }
      }
    }

    return NextResponse.json({ success: true, data: { amount: parsed.amount || '' } });

  } catch (err: any) {
    console.error('scan-receipt error:', err);
    return NextResponse.json({ error: err.message || 'Lỗi server' }, { status: 500 });
  }
}
