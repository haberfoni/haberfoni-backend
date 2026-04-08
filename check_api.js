import axios from 'axios';

async function check() {
    try {
        const response = await axios.get('http://localhost:3000/api/news', {
            params: { limit: 20 }
        });
        
        console.log(`API returned ${response.data.data.length} items.`);
        response.data.data.forEach(n => {
            console.log(`ID: ${n.id} | Title: ${n.title} | Image: ${n.image_url}`);
        });

        const headlines = await axios.get('http://localhost:3000/api/headlines');
        console.log(`\nAPI returned ${headlines.data.length} headlines.`);
        headlines.data.forEach((h, idx) => {
             console.log(`Slot ${idx}: ${h?.title || 'empty'}`);
        });

    } catch (e) {
        console.error(e.message);
    }
}

check();
