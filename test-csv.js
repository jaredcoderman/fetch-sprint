const csv = require('csv-parser');
const fs = require('fs');

// Test script to examine CSV structure
let rowCount = 0;
const sampleRows = [];

fs.createReadStream('Most-Recent-Cohorts-Institution_05192025.csv')
  .pipe(csv())
  .on('data', (row) => {
    rowCount++;
    
    // Collect first 3 rows for inspection
    if (rowCount <= 3) {
      sampleRows.push({
        unitId: row['﻿UNITID'] || row['UNITID'],
        name: row['INSTNM'],
        city: row['CITY'],
        state: row['STABBR'],
        website: row['INSTURL']
      });
    }
  })
  .on('end', () => {
    console.log(`Total rows in CSV: ${rowCount}`);
    console.log('\nSample data:');
    console.log(JSON.stringify(sampleRows, null, 2));
    
    // Count schools with valid names
    let validSchools = 0;
    fs.createReadStream('Most-Recent-Cohorts-Institution_05192025.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (row['INSTNM'] && row['INSTNM'].trim() !== '') {
          validSchools++;
        }
      })
      .on('end', () => {
        console.log(`\nSchools with valid names: ${validSchools}`);
      });
  })
  .on('error', (error) => {
    console.error('Error reading CSV:', error);
  });
