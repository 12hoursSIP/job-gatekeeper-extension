const OPENAI_API_KEY = 'YOUR_OPENAI_KEY_HERE'; // <--- PASTE KEY HERE

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('generateBtn');
  
  if (button) {
    button.addEventListener('click', () => {
      const resultsDiv = document.getElementById('results');
      const loadingDiv = document.getElementById('loading');
      
      loadingDiv.style.display = 'block';
      resultsDiv.innerHTML = '';
      
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          function: getUserSelection
        }, (results) => {
          
          if (results && results[0] && results[0].result && results[0].result.trim().length > 0) {
            const jobText = results[0].result;
            analyzeWithGPT(jobText, resultsDiv, loadingDiv);
          } else {
            loadingDiv.style.display = 'none';
            resultsDiv.innerHTML = `
              <p style="color:#d9534f; font-weight:bold;">No text selected!</p>
              <ul style="text-align:left; padding-left:20px; color:#555;">
                <li>Highlight the Company Info AND Job Description.</li>
                <li>Click the extension icon.</li>
                <li>Click "Generate".</li>
              </ul>
            `;
          }
        });
      });
    });
  }
});

function getUserSelection() {
  return window.getSelection().toString();
}

async function analyzeWithGPT(text, resultsDiv, loadingDiv) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "system",
          content: `You are an Evidence-Based I/O Psychologist. Analyze the highlighted text.
          
          OUTPUT RULES:
          1. Return raw HTML only.
          2. STICK TO FACTS. Do not use cynical or emotional language.
          3. Translate "keywords" into "operational definitions" (what actually happens day-to-day).
          4. Max 8 words per line.
          
          Structure exactly like this:

          <h3>🏢 Company Intel</h3>
          <ul style="padding-left: 20px;">
             <li><b>Vibe:</b> [e.g. "Structured Corporate" or "Early-stage Startup"]</li>
             <li><b>Mode:</b> [Remote / Hybrid / On-site]</li>
          </ul>

          <h3>🔎 Culture Decoder (Operational Reality)</h3>
          <ul style="padding-left: 20px;">
             <li><b>"[Quote 1]"</b> <br> → <i>[Fact. e.g. "Requires managing multiple concurrent deadlines"]</i></li>
             <li><b>"[Quote 2]"</b> <br> → <i>[Fact. e.g. "Role definition may change frequently"]</i></li>
             <li><b>"[Quote 3]"</b> <br> → <i>[Fact. e.g. "Work outside standard hours may be required"]</i></li>
          </ul>
          
          <h3>🛑 Hard Specs</h3>
          <ul style="padding-left: 20px;">
             <li><b>🎓 Edu:</b> [Degree]</li>
             <li><b>⏳ Exp:</b> [Years]</li>
             <li><b>🛠 Skill:</b> [Top Skill]</li>
          </ul>
          
          <h3>🧠 The "Gut Check"</h3>
          <ul style="padding-left: 20px;">
            <li style="margin-bottom: 12px;">
              <b>The Routine:</b><br>
              This role explicitly requires [Tedious Task].
              <i><br>Are you willing to perform this daily?</i>
            </li>
            
            <li>
              <b>Work Style:</b><br>
              Environment is [Adjective]. 
              <i><br>If you strictly prefer [Opposite], this is not a fit.</i>
            </li>
          </ul>`
        }, {
          role: "user",
          content: text.substring(0, 5000)
        }]
      })
    });

    const data = await response.json();
    loadingDiv.style.display = 'none';
    
    if (data.error) {
      resultsDiv.innerHTML = `<p style="color:red">OpenAI Error: ${data.error.message}</p>`;
    } else {
      resultsDiv.innerHTML = data.choices[0].message.content;
    }
  } catch (error) {
    loadingDiv.style.display = 'none';
    resultsDiv.innerHTML = `<p style="color:red">Network Error: ${error.message}</p>`;
  }
}