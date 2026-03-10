
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split('\n');
const aiLine = lines.find(l => l.startsWith('AI_API_KEY='));

if (aiLine) {
    const val = aiLine.split('=')[1].trim();
    console.log('Key:', val);
    console.log('Length:', val.length);
    console.log('Hex:', Buffer.from(val).toString('hex'));
} else {
    console.log('AI_API_KEY not found in .env');
}
