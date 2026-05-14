const fs = require('fs');
const path = 'app/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Find the closing sections paragraph that contains the old text
// This one is in a p tag with text-xl, in the glass-card with orange border
const pattern = /{\/\* Closing Sections \*\/[\s\S]*?border-orange-500[\s\S]*?<p className="text-on-surface-variant leading-relaxed text-xl">([\s\S]*?)<\/p>/;

const newContent = `                   <div className="glass-card p-8 rounded-2xl flex flex-col gap-6 border-b-4 border-orange-500 bg-orange-50/20">
                      <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-orange-600 text-3xl">favorite</span>
                      </div>
                      <div className="space-y-3">
                        <p className="text-on-surface-variant leading-relaxed font-medium">Hãy dành một ngày cho chính mình - những tháng năm học trò.</p>
                        <p className="text-on-surface-variant leading-relaxed font-medium">Hãy dành một ngày cho những người bạn từng rất thân - rồi xa nhau lúc nào không hay.</p>
                      </div>
                   </div>`;

// Let me try a simpler approach: find the exact section and replace it
const closingStart = content.indexOf('{/* Closing Sections */}');
const closingEnd = content.indexOf('{/* Final Call to Action */}', closingStart);
const closingSection = content.substring(closingStart, closingEnd);

if (closingSection.includes('Nếu bạn đã từng nghĩ') && closingSection.includes('text-orange-600')) {
  console.log('Found the target section');
  
  // Extract and replace within closing section
  const updated = closingSection.replace(
    /<div className="grid[\s\S]*?<\/div>\s*$/m,
    `<div className="grid md:grid-cols-2 gap-8">
                   <div className="glass-card p-8 rounded-2xl flex flex-col gap-6 border-b-4 border-orange-500 bg-orange-50/20">
                      <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-orange-600 text-3xl">favorite</span>
                      </div>
                      <div className="space-y-3">
                        <p className="text-on-surface-variant leading-relaxed font-medium">Hãy dành một ngày cho chính mình - những tháng năm học trò.</p>
                        <p className="text-on-surface-variant leading-relaxed font-medium">Hãy dành một ngày cho những người bạn từng rất thân - rồi xa nhau lúc nào không hay.</p>
                      </div>
                   </div>
                   <div className="glass-card p-8 rounded-2xl flex flex-col gap-6 border-b-4 border-primary bg-primary/5">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-primary text-3xl">local_shipping</span>
                      </div>
                      <p className="text-on-surface-variant leading-relaxed text-lg font-medium">
                        Hãy cùng nối lại những toa tàu, viết hành trình cho chuyến tàu <span className="text-primary font-bold">"2003-2006"</span> ngày ấy.
                      </p>
                   </div>
                </div>`
  );
  
  const finalContent = content.substring(0, closingStart) + updated + content.substring(closingEnd);
  fs.writeFileSync(path, finalContent, 'utf-8');
  console.log('Updated closing sections successfully');
} else {
  console.log('Could not find target section');
}
