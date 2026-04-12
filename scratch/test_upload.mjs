import fs from 'fs';

async function testUpload() {
    const API_URL = 'http://localhost:3000/api';
    
    // Create a dummy image file
    const dummyImagePath = 'scratch/dummy.jpg';
    fs.writeFileSync(dummyImagePath, 'dummy content');
    
    const formData = new FormData();
    const blob = new Blob(['dummy content'], { type: 'image/jpeg' });
    formData.append('file', blob, 'test.jpg');

    try {
        const response = await fetch(`${API_URL}/presence/upload`, {
            method: 'POST',
            body: formData,
        });
        
        const data = await response.json();
        console.log('Status Code:', response.status);
        console.log('Response body:', data);
    } catch (error) {
        console.log('Fetch Error:', error.message);
    }
}

testUpload();
