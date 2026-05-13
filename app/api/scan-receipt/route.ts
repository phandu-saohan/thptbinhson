import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType, expectedAmount } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình GEMINI_API_KEY' }, { status: 500 });
    }

    const expectedFormatted = parseInt(expectedAmount).toLocaleString('vi-VN');

    const prompt = `Bạn là trợ lý kiểm duyệt biên lai chuyển khoản ngân hàng tại Việt Nam.

Số tiền cần xác minh: ${expectedAmount} VNĐ (${expectedFormatted} đồng)

Nhiệm vụ:
1. Xác định đây có phải ảnh chụp màn hình biên lai "Chuyển tiền thành công" của ứng dụng ngân hàng Việt Nam không? (Nếu là ảnh selfie, phong cảnh, logo, hóa đơn khác → KHÔNG HỢP LỆ)
2. Đọc số tiền đã chuyển trong biên lai. Kiểm tra xem số tiền đó có bằng đúng ${expectedAmount} VNĐ không? (Cho phép sai lệch ±1000đ do làm tròn)

Trả về ĐÚNG định dạng JSON sau, KHÔNG kèm text khác:
{
  "isValidBankReceipt": true hoặc false,
  "extractedAmount": "chỉ gồm chữ số, ví dụ 2000000",
  "isAmountMatch": true hoặc false
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "You are a bank receipt validator. Output ONLY a raw JSON object with no markdown, no explanation, no extra text." }]
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
            responseMimeType: "application/json"
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
    let text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    if (!text) {
      return NextResponse.json({ 
        error: 'AI không nhận diện được nội dung trong ảnh. Vui lòng thử ảnh rõ hơn.' 
      }, { status: 422 });
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch (err) {
      console.error('Lỗi parse JSON từ Gemini:', text);
      return NextResponse.json({ error: 'AI xử lý ảnh thất bại. Vui lòng thử lại.' }, { status: 422 });
    }

    // Kiểm tra 1: Ảnh có phải biên lai ngân hàng không?
    if (!parsedResult.isValidBankReceipt) {
      return NextResponse.json({ 
        error: 'Ảnh không phải biên lai chuyển khoản ngân hàng. Vui lòng chụp màn hình ứng dụng ngân hàng sau khi chuyển tiền thành công.' 
      }, { status: 400 });
    }

    // Kiểm tra 2: Số tiền có khớp không?
    if (!parsedResult.isAmountMatch) {
      const aiAmount = parsedResult.extractedAmount 
        ? parseInt(parsedResult.extractedAmount).toLocaleString('vi-VN') + 'đ'
        : 'không đọc được';
      const expectedFmt = parseInt(expectedAmount).toLocaleString('vi-VN') + 'đ';
      return NextResponse.json({ 
        error: `Sai số tiền: Biên lai ghi ${aiAmount} nhưng cần chuyển ${expectedFmt}.` 
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: { amount: parsedResult.extractedAmount } });

  } catch (err: any) {
    console.error('scan-receipt error:', err);
    return NextResponse.json({ error: err.message || 'Lỗi server' }, { status: 500 });
  }
}
