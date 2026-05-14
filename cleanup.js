const fs = require('fs');
const path = 'app/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Remove duplicate closing content
// Find the pattern of duplicate cards and old paragraph after the new closing grid
const pattern = /(<\/div>\s*<\/div>\s*)\s*<p className="text-on-surface-variant leading-relaxed text-xl">([\s\S]*?)<\/div>\s*<\/div>\n\s*{\/\* Final Call/;

const replacement = `</div>
</div>

                {/* Final Call`;

const updated = content.replace(pattern, replacement);

if (updated !== content) {
  fs.writeFileSync(path, updated, 'utf-8');
  console.log('Cleaned up duplicate content successfully');
} else {
  console.log('No duplicate content found to remove');
  
  // Let's try a different pattern
  const closingEnd = content.indexOf('{/* Final Call to Action */}');
  const closingStart = content.lastIndexOf('{/* Closing Sections */}');
  
  if (closingStart > 0 && closingEnd > closingStart) {
    const section = content.substring(closingStart, closingEnd);
    const gridCount = (section.match(/<div className="grid/g) || []).length;
    const endDivCount = (section.match(/<\/div>/g) || []).length;
    
    console.log('Closing section grid divs:', gridCount);
    console.log('Closing section end divs:', endDivCount);
    console.log('First 500 chars:', section.substring(0, 500));
  }
}
