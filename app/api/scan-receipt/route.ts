import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình GEMINI_API_KEY' }, { status: 500 });
    }

    const prompt = `Đây là ảnh biên lai/screenshot chuyển khoản ngân hàng Việt Nam.
Hãy đọc và trích xuất chính xác:
1. Tên người chuyển khoản (người gửi tiền) — thường ghi "Tên người gửi", "Nguyen Van A", v.v.
2. Số điện thoại nếu có trong nội dung chuyển khoản
3. Số tiền đã chuyển — chỉ lấy số, bỏ chữ "VND", "đồng", dấu chấm/phẩy

Trả về JSON thuần theo đúng định dạng (không markdown, không giải thích thêm):
{"name": "...", "phone": "...", "amount": "..."}

Nếu không tìm thấy trường nào thì để chuỗi rỗng "".
CHỈ trả về JSON, không gì khác.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
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

    // Parse JSON từ response
    const cleaned = text.replace(/```json|```/g, '').trim();
    let parsed: { name?: string; phone?: string; amount?: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Thử extract JSON từ text nếu có text thừa
      const match = cleaned.match(/\{[^}]+\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        return NextResponse.json({ error: 'AI trả về định dạng không đúng', raw: text }, { status: 422 });
      }
    }

    return NextResponse.json({ success: true, data: parsed });

  } catch (err: any) {
    console.error('scan-receipt error:', err);
    return NextResponse.json({ error: err.message || 'Lỗi server' }, { status: 500 });
  }
}
