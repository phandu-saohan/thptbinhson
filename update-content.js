const fs = require('fs');
const path = 'app/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

const old = '                      <p className="text-on-surface-variant leading-relaxed text-xl">\n                        Nếu bạn đã từng nghĩ <span className="italic">"để khi khác"</span>… <br/>\n                        <span className="text-orange-600 font-bold">Thì đây chính là "khi khác" mà chúng ta đã chờ rất lâu.</span>\n                      </p>';

const newContent = '                      <div className="space-y-3">\n                        <p className="text-on-surface-variant leading-relaxed font-medium">Hãy dành một ngày cho chính mình - những tháng năm học trò.</p>\n                        <p className="text-on-surface-variant leading-relaxed font-medium">Hãy dành một ngày cho những người bạn từng rất thân - rồi xa nhau lúc nào không hay.</p>\n                      </div>';

content = content.replace(old, newContent);
fs.writeFileSync(path, content, 'utf-8');
console.log('Updated successfully');
