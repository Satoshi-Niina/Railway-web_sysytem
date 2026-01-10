const fetch = require('node-fetch');

(async () => {
  try {
    console.log('Testing /api/machines endpoint...\n');
    
    const response = await fetch('http://localhost:3000/api/machines');
    console.log('Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Error response:', text);
      process.exit(1);
    }
    
    const data = await response.json();
    console.log('\nTotal machines:', data.length);
    console.log('\nFirst machine:');
    console.log(JSON.stringify(data[0], null, 2));
    
    console.log('\nChecking model_name field:');
    const withModelName = data.filter(m => m.model_name);
    const withoutModelName = data.filter(m => !m.model_name);
    console.log(`With model_name: ${withModelName.length}`);
    console.log(`Without model_name: ${withoutModelName.length}`);
    
    if (withModelName.length > 0) {
      console.log('\nSample machines with model_name:');
      withModelName.slice(0, 5).forEach(m => {
        console.log(`- ${m.machine_number}: ${m.model_name}`);
      });
    }
    
    if (withoutModelName.length > 0) {
      console.log('\nMachines without model_name:');
      withoutModelName.forEach(m => {
        console.log(`- ${m.machine_number}: machine_type=${m.machine_type}`);
      });
    }
    
    // Unique model names
    const modelNames = [...new Set(data.map(m => m.model_name).filter(Boolean))];
    console.log('\n\nUnique model_name values:', modelNames.sort());
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
