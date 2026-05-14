const fs = require('fs');
const path = 'app/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Remove the orphaned paragraph and divs after the closing sections grid
const pattern = /(<\/div>\s*<\/div>\n\s*)\s*<p className="text-on-surface-variant leading-relaxed text-xl">[\s\S]*?<\/div>\s*<\/div>\s*(<\!-- Final Call)/;

const replacement = '$1                {/* Final Call';

const updated = content.replace(pattern, replacement);

if (updated !== content) {
  fs.writeFileSync(path, updated, 'utf-8');
  console.log('Removed orphaned content successfully');
} else {
  console.log('Pattern not found, trying alternative...');
  
  // Try a simpler approach: find and remove the exact orphaned section
  const lines = content.split('\n');
  let inOrphaned = false;
  let newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if we're hitting the orphaned paragraph
    if (line.includes('text-on-surface-variant leading-relaxed text-xl') && 
        line.includes('Nếu bạn đã từng') &&
        i > 740) { // Make sure it's after the closing sections
      inOrphaned = true;
      console.log('Found orphaned paragraph at line', i + 1);
      // Skip this and subsequent orphaned content
      continue;
    }
    
    // Skip orphaned closing divs
    if (inOrphaned && line.trim() === '</div>') {
      console.log('Skipping orphaned closing div at line', i + 1);
      continue;
    }
    
    // Check if we've reached the Final Call comment
    if (line.includes('{/* Final Call')) {
      inOrphaned = false;
    }
    
    newLines.push(line);
  }
  
  const result = newLines.join('\n');
  if (result !== content) {
    fs.writeFileSync(path, result, 'utf-8');
    console.log('Cleaned up orphaned content using line-by-line approach');
  } else {
    console.log('No changes made');
  }
}
