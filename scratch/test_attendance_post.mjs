import axios from 'axios';

async function testAttendance() {
    const API_URL = 'http://localhost:3000/api';
    try {
        const res = await axios.post(`${API_URL}/presence/history`, {
            employee_id: 1, 
            type: 'clock_in',
            photo_url: '/uploads/presence/test.jpg',
            location_lat: -0.816431, 
            location_lng: 103.468202,
            note: 'Test POST from script'
        });
        console.log('Success:', res.data);
    } catch (error) {
        if (error.response) {
            console.log('Error 500 Details:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testAttendance();
