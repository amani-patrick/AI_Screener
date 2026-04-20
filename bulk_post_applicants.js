const fs = require('fs');

const applicants = JSON.parse(fs.readFileSync('test_applicants.json', 'utf8'));

async function postApplicant(applicant) {
  try {
    const response = await fetch('http://localhost:3001/api/applicants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(applicant)
    });
    const data = await response.json();
    console.log(`Posted ${applicant.fullName}: ${response.status} ${response.statusText}`);
    if (!response.ok) {
      console.error('Error:', data);
    }
  } catch (error) {
    console.error(`Failed to post ${applicant.fullName}:`, error.message);
  }
}

async function main() {
  console.log(`Starting bulk POST for ${applicants.length} applicants...`);
  for (const applicant of applicants) {
    await postApplicant(applicant);
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log('Bulk POST completed.');
}

main();
