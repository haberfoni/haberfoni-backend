
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Triggering Bot via API ---');
    try {
        const res = await axios.post('http://localhost:3000/bot/run');
        console.log('API Response:', res.data);

        const commandId = res.data.commandId;
        if (!commandId) {
            console.error('No commandId returned!');
            return;
        }

        console.log(`Command ID: ${commandId}`);

        // Poll status via API
        for (let i = 0; i < 10; i++) {
            const statusRes = await axios.get('http://localhost:3000/bot/status');
            const cmd = statusRes.data;
            console.log(`[${i}s] API Status: ${cmd?.status} (ID: ${cmd?.id})`);

            if (cmd?.status === 'COMPLETED' || cmd?.status === 'FAILED') break;
            await new Promise(r => setTimeout(r, 2000));
        }

    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) console.error('Data:', e.response.data);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
