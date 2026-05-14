const fs = require('fs');
const path = 'app/page.tsx';
const content = fs.readFileSync(path, 'utf-8');
const lines = content.split('\n');

// The orphaned content is from approximately line 743 to 758
// Let's find the exact range by looking for the closing grid div and the Final Call comment
let gridCloseIndex = -1;
let finalCallIndex = -1;

for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('{/* Final Call to Action */}')) {
    finalCallIndex = i;
    break;
  }
}

// Find the last properly closed grid div before that
for (let i = finalCallIndex - 1; i >= 0; i--) {
  if (lines[i].includes('</div>') && 
      i > 0 &&  
      (lines[i-1].includes('</p>') || lines[i-1].includes('</div>'))) {
    // Check if this closes the grid that opened after "Closing Sections"
    let closingCount = 1;
    let openingFound = false;
    
    for (let j = i - 1; j >= 0; j--) {
      if (lines[j].includes('</div>')) closingCount++;
      if (lines[j].includes('<div')) closingCount--;
      
      if (lines[j].includes('Closing Sections') && closingCount === 0) {
        gridCloseIndex = i;
        openingFound = true;
        break;
      }
    }
    
    if (openingFound) break;
  }
}

console.log('Grid close at line:', gridCloseIndex + 1);
console.log('Final Call at line:', finalCallIndex + 1);

if (gridCloseIndex > 0 && finalCallIndex > gridCloseIndex) {
  // Remove lines between grid close and Final Call (exclusive)
  const newLines = [...lines.slice(0, gridCloseIndex + 1), '', ...lines.slice(finalCallIndex)];
  const result = newLines.join('\n');
  
  fs.writeFileSync(path, result, 'utf-8');
  console.log('Successfully removed orphaned lines');
  console.log(`Removed ${finalCallIndex - gridCloseIndex - 1} lines`);
} else {
  console.log('Could not identify the exact range to remove');
  console.log('Lines around closing grid:');
  for (let i = Math.max(0, gridCloseIndex - 2); i <= Math.min(lines.length - 1, gridCloseIndex + 5); i++) {
    console.log(`${i + 1}: ${lines[i].substring(0, 80)}`);
  }
}
