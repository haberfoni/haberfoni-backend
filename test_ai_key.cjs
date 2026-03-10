
const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.AI_API_KEY;
const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent';

async function testAI() {
  console.log('Testing AI with key:', apiKey?.substring(0, 5) + '...');
  try {
    const response = await axios.post(`${apiUrl}?key=${apiKey}`, {
      contents: [{
        parts: [{ text: 'Merhaba, bu bir testtir. Sadece "TAMAM" de.' }]
      }]
    });
    console.log('AI Response:', JSON.stringify(response.data.candidates[0].content.parts[0].text));
  } catch (error) {
    console.error('AI Test Failed:', error.response?.status, error.response?.data || error.message);
  }
}

testAI();
