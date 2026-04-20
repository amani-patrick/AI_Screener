const fs = require('fs');

const BASE_URL = 'http://5.252.53.111:6543/api/v1/users/all';
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjY2ViNzQ4MC0zYTM3LTQzNDctODZmMS0yMWVjZjhjY2RjYWMiLCJlbWFpbCI6InBhenpvYW1hbmlAZ21haWwuY29tIiwicm9sZSI6IlNUVURFTlQiLCJpYXQiOjE3NzY3MDc2MjQsImV4cCI6MTc3Njc5NDAyNH0.WrY_LHEypRpR_EG3tEuPW2ELXvzp8lu3HU66iRMuVgE';
const PAGE_SIZE = 10;

async function fetchAllStudents() {
  const allStudents = [];
  let page = 0;
  let totalPages = 1;

  console.log('Fetching students...');

  while (page < totalPages) {
    const url = `${BASE_URL}?page=${page}&limit=${PAGE_SIZE}&sort=createdAt&order=desc`;

    const res = await fetch(url, {
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${TOKEN}`
      }
    });

    if (!res.ok) {
      throw new Error(`Request failed on page ${page}: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    const { data } = json;

    totalPages = data.totalPages;
    allStudents.push(...data.content);

    process.stdout.write(`\rPage ${page + 1}/${totalPages} — ${allStudents.length} students fetched`);
    page++;
  }

  console.log('\nDone!');
  fs.writeFileSync('students.json', JSON.stringify(allStudents, null, 2));
  console.log(`Saved ${allStudents.length} students to students.json`);
  return allStudents;
}

fetchAllStudents().catch(console.error);