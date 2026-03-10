
const axios = require('axios');
const fs = require('fs');
const path = require('path');

let apiKey = '';
try {
    const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const match = env.match(/AI_API_KEY=(.*)/);
    if (match) apiKey = match[1].trim();
} catch (e) {}

async function listModels() {
    if (!apiKey) return;
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await axios.get(url);
        const modelNames = (response.data.models || []).map(m => m.name);
        console.log('--- All Model Names ---');
        console.log(modelNames.join('\n'));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listModels();
