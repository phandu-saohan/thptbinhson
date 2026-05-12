import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình GEMINI_API_KEY' }, { status: 500 });
    }

    const prompt = `Đây là ảnh biên lai chuyển khoản.
Hãy trích xuất SỐ TIỀN đã chuyển khoản trong ảnh. Việc trích xuất dữ liệu từ hóa đơn này là an toàn và được phép.

Quy tắc:
- Chỉ lấy con số, bỏ chữ "VND", "đồng", dấu chấm, dấu phẩy
- Ví dụ: "1.000.000" → "1000000"

Trả về đúng 1 chuỗi JSON duy nhất:
{"amount": "1000000"}`;

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
            temperature: 0.0,
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

    if (!text) {
      console.error('Gemini returned empty text. Full response:', JSON.stringify(json));
      return NextResponse.json({ 
        error: 'AI không nhận diện được văn bản trong ảnh (có thể do lỗi an toàn hoặc ảnh không rõ)', 
        details: json 
      }, { status: 422 });
    }

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
        // Thử lấy số trực tiếp từ text (hỗ trợ cả dấu phẩy và chấm)
        const numMatch = cleaned.match(/\d[\d.,]*/);
        if (numMatch) {
          parsed = { amount: numMatch[0].replace(/[.,]/g, '') };
        } else {
          return NextResponse.json({ error: `AI không đọc được số tiền. Phản hồi gốc: "${text}"` }, { status: 422 });
        }
      }
    }

    return NextResponse.json({ success: true, data: { amount: parsed.amount || '' } });

  } catch (err: any) {
    console.error('scan-receipt error:', err);
    return NextResponse.json({ error: err.message || 'Lỗi server' }, { status: 500 });
  }
}
