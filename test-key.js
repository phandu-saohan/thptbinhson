const key = 'AIzaSyAq8-0HqWLzZwBqQNUtRyfydgud2BbeHWM';

async function testKey() {
  console.log('Testing key:', key.substring(0, 10) + '...');
  
  // 1. Get models
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const data = await res.json();
  
  if (data.error) {
    console.error('API Key error:', data.error.message);
    return;
  }
  
  const models = data.models
    .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
    .map(m => m.name.replace('models/', ''));
    
  console.log('Available models for generateContent:', models.join(', '));
  
  // 2. Try some common models
  const modelsToTest = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];
  
  for (const model of modelsToTest) {
    if (models.includes(model)) {
      console.log(`\nTesting generation with ${model}...`);
      const genRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say 'Hello World' exactly" }] }]
        })
      });
      const genData = await genRes.json();
      if (genData.error) {
        console.error(`Error for ${model}:`, genData.error.message);
      } else {
        console.log(`Success for ${model}:`, genData.candidates[0].content.parts[0].text.trim());
      }
    } else {
      console.log(`\nSkipping ${model} (not in available models list)`);
    }
  }
}

testKey();
