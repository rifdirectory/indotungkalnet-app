async function testAttendance() {
    const API_URL = 'http://localhost:3000/api';
    const payload = {
        employee_id: 1, 
        type: 'clock_in',
        photo_url: '/uploads/presence/test.jpg',
        location_lat: -0.816431, 
        location_lng: 103.468202,
        note: 'Test POST from script'
    };

    try {
        const response = await fetch(`${API_URL}/presence/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        
        const data = await response.json();
        console.log('Status Code:', response.status);
        console.log('Response body:', data);
    } catch (error) {
        console.log('Fetch Error:', error.message);
    }
}

testAttendance();
