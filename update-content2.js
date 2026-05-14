const fs = require('fs');
const path = 'app/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Use regex to find and replace the old paragraph with new content
// This is more flexible with whitespace differences
const pattern = /                      <p className="text-on-surface-variant leading-relaxed text-xl">[\s\S]*?Thì đây chính là "khi khác" mà chúng ta đã chờ rất lâu\.<\/span>[\s\S]*?<\/p>/;

const newContent = `                      <div className="space-y-3">
                        <p className="text-on-surface-variant leading-relaxed font-medium">Hãy dành một ngày cho chính mình - những tháng năm học trò.</p>
                        <p className="text-on-surface-variant leading-relaxed font-medium">Hãy dành một ngày cho những người bạn từng rất thân - rồi xa nhau lúc nào không hay.</p>
                      </div>`;

if (pattern.test(content)) {
  console.log('Pattern found, replacing...');
  content = content.replace(pattern, newContent);
  fs.writeFileSync(path, content, 'utf-8');
  console.log('Updated successfully');
} else {
  console.log('Pattern not found');
  // Try to find what's actually there
  const start = content.indexOf('Nếu bạn đã từng nghĩ');
  if (start > 0) {
    console.log('Found target text at position:', start);
    console.log('Context:', content.substring(start - 100, start + 200));
  }
}
