const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 3000);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const profile = {
  name: 'Ankit Kumar',
  title: 'Full Stack Web Developer and Generative AI Developer',
  education: 'B.Tech in Artificial Intelligence and Data Science at Sengunthar Engineering College, 2023–2027, CGPA 7.8/10.',
  skills: 'HTML5, CSS3, JavaScript, responsive design, React, Node.js, Express.js, REST APIs, PostgreSQL, MongoDB, SQL, prompt engineering, LLM APIs, Git, GitHub, VS Code, and DevTools.',
  projects: 'No projects have been published yet. New projects are on their way.',
  contact: 'ankitkumar.data39@gmail.com, GitHub at github.com/ankitbuilds-SEC, and LinkedIn at linkedin.com/in/ankit-kumar-b66067406.'
};

const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  response.end(JSON.stringify(payload));
}

function requestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => {
      body += chunk;
      if (body.length > 50_000) reject(new Error('Request body is too large.'));
    });
    request.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON body.')); }
    });
    request.on('error', reject);
  });
}

function allowed(request) {
  const key = request.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (rateLimit.get(key) || []).filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) return false;
  recent.push(now);
  rateLimit.set(key, recent);
  return true;
}

function fallbackAnswer(message) {
  const text = message.toLowerCase();
  if (text.includes('education') || text.includes('college') || text.includes('degree')) return profile.education;
  if (text.includes('skill') || text.includes('technology') || text.includes('tech')) return `Ankit's published skills include ${profile.skills}`;
  if (text.includes('project')) return profile.projects;
  if (text.includes('contact') || text.includes('email') || text.includes('github') || text.includes('linkedin')) return `You can contact Ankit at ${profile.contact}`;
  if (text.includes('who') || text.includes('about') || text.includes('ankit')) return `${profile.name} is a ${profile.title}. He builds modern web experiences and explores Generative AI through creative technology.`;
  return 'I can answer questions about Ankit’s education, skills, projects, interests, and contact details.';
}

async function openAiAnswer(message) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        { role: 'system', content: `You are Ankit Kumar's portfolio assistant. Use only this published information: ${JSON.stringify(profile)}. Never invent facts. If information is missing, say it is not published. Keep answers concise and friendly.` },
        { role: 'user', content: message }
      ],
      max_output_tokens: 300
    })
  });
  if (!response.ok) throw new Error(`OpenAI request failed with status ${response.status}.`);
  const data = await response.json();
  const answer = typeof data.output_text === 'string' ? data.output_text.trim() : '';
  if (!answer) throw new Error('OpenAI returned an empty response.');
  return answer;
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return sendJson(response, 204, {});
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'GET' && url.pathname === '/api/education') {
    return sendJson(response, 200, [{ start_year: '2023', end_year: '2027', status: 'CURRENTLY PURSUING', degree: 'Bachelor of Technology (B.Tech)', field_of_study: 'Artificial Intelligence and Data Science', institution: 'Sengunthar Engineering College', cgpa: '7.8' }]);
  }

  if (request.method === 'GET' && url.pathname === '/api/chatbot/status') {
    return sendJson(response, 200, { enabled: true, apiConfigured: Boolean(OPENAI_API_KEY) });
  }

  if (request.method === 'POST' && url.pathname === '/api/chatbot/message') {
    if (!allowed(request)) return sendJson(response, 429, { error: 'Too many assistant messages. Please wait a minute and try again.' });
    try {
      const body = await requestBody(request);
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      if (!message) return sendJson(response, 400, { error: 'Please enter a message for the AI assistant.' });
      if (message.length > 2000) return sendJson(response, 400, { error: 'Messages must be 2000 characters or fewer.' });
      if (!OPENAI_API_KEY) return sendJson(response, 200, { answer: fallbackAnswer(message), provider: 'offline', fallbackUsed: true });
      try { return sendJson(response, 200, { answer: await openAiAnswer(message), provider: 'openai', fallbackUsed: false }); } catch (error) {
        return sendJson(response, 200, { answer: fallbackAnswer(message), provider: 'offline', fallbackUsed: true, status: error.message });
      }
    } catch (error) { return sendJson(response, 400, { error: error.message }); }
  }

  sendJson(response, 404, { error: 'Not found.' });
});

server.listen(PORT, () => console.log(`Portfolio API listening on http://localhost:${PORT}`));
