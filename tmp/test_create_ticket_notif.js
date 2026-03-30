async function run() {
  const payload = {
    customer_id: 1485,
    category: 'Gangguan Teknik',
    subject: 'Tes Notifikasi System',
    priority: 'High',
    difficulty: 'Low',
    description: 'Ini adalah tiket uji coba untuk verifikasi sistem notifikasi baru.',
    assigned_to: [8] // M. Darussalam
  };

  console.log('Sending POST request to /api/support...');
  try {
    const response = await fetch('http://localhost:3000/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

run();
