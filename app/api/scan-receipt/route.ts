import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType, expectedAmount, expectedName, expectedPhone } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình GEMINI_API_KEY' }, { status: 500 });
    }

    const prompt = `Bạn là một trợ lý kiểm duyệt biên lai chuyển khoản của ngân hàng tại Việt Nam.
Tôi sẽ cung cấp cho bạn 3 thông tin dự kiến từ người dùng:
- Số tiền dự kiến: ${expectedAmount} VNĐ
- Tên người gửi: ${expectedName}
- Số điện thoại: ${expectedPhone}

Nhiệm vụ của bạn:
1. Xác nhận đây có PHẢI là ảnh chụp màn hình biên lai chuyển khoản thành công của ngân hàng tại Việt Nam không?
2. Trích xuất số tiền đã chuyển. Kiểm tra xem nó có bằng đúng với Số tiền dự kiến không?
3. Trích xuất nội dung chuyển khoản. Kiểm tra xem nội dung chuyển khoản có chứa Tên người gửi và Số điện thoại dự kiến không? (Bạn có thể bỏ qua sự khác biệt về dấu tiếng Việt, viết hoa viết thường, hoặc thiếu/dư khoảng trắng. Miễn là đọc vào nhận ra được họ tên và SĐT).

Bạn PHẢI trả về KẾT QUẢ ĐẦU RA là MỘT ĐỐI TƯỢNG JSON chuẩn, KHÔNG kèm theo bất kỳ văn bản nào khác, KHÔNG dùng markdown \`\`\`json. Định dạng như sau:
{
  "isValidBankReceipt": true/false,
  "extractedAmount": "số tiền trích xuất (chỉ gồm chữ số, vd 2000000)",
  "isAmountMatch": true/false,
  "extractedNote": "nội dung chuyển khoản trích xuất",
  "isNoteMatch": true/false,
  "reason": "Nếu bất kỳ điều kiện nào (isValidBankReceipt, isAmountMatch, isNoteMatch) là false, hãy ghi rõ lý do ngắn gọn bằng tiếng Việt. Nếu tất cả true, để chuỗi rỗng."
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "You are a precise data extractor and validator. You must output ONLY a raw JSON object. Do not output any conversational text or markdown wrappers." }]
          },
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64 } }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 512,
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
    
    // Clean up possible markdown if AI ignored the instruction
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    if (!text) {
      console.error('Gemini returned empty text. Full response:', JSON.stringify(json));
      return NextResponse.json({ 
        error: 'AI không nhận diện được văn bản trong ảnh (có thể do lỗi an toàn hoặc ảnh không rõ)', 
        details: json 
      }, { status: 422 });
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch (err) {
      console.error('Lỗi parse JSON từ Gemini:', text);
      return NextResponse.json({ error: 'AI trả về định dạng không hợp lệ', rawText: text }, { status: 422 });
    }

    // Kiểm tra kết quả
    if (!parsedResult.isValidBankReceipt) {
      return NextResponse.json({ error: parsedResult.reason || 'Ảnh tải lên không phải là biên lai chuyển khoản hợp lệ.' }, { status: 400 });
    }

    if (!parsedResult.isAmountMatch) {
      return NextResponse.json({ error: parsedResult.reason || `Số tiền chuyển không khớp với ${expectedAmount}đ.` }, { status: 400 });
    }

    if (!parsedResult.isNoteMatch) {
      return NextResponse.json({ error: parsedResult.reason || 'Nội dung chuyển khoản không chứa đủ Họ Tên và Số điện thoại của bạn.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: { amount: parsedResult.extractedAmount, note: parsedResult.extractedNote } });

  } catch (err: any) {
    console.error('scan-receipt error:', err);
    return NextResponse.json({ error: err.message || 'Lỗi server' }, { status: 500 });
  }
}
