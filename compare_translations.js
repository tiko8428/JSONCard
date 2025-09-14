const fs = require('fs');

// Load both JSON files
const germanFile = JSON.parse(fs.readFileSync('./json_db/B2_de.json', 'utf8'));
const englishFile = JSON.parse(fs.readFileSync('./json_db/B2_en.json', 'utf8'));

// Compare and identify issues
const issues = [];

Object.keys(germanFile).forEach(key => {
    const german = germanFile[key];
    const english = englishFile[key];
    
    if (!english) {
        issues.push(`Missing entry ${key} in English file`);
        return;
    }
    
    // Check for obvious translation errors
    const entry = {
        key,
        german: {
            field1: german.field1,
            field2: german.field2,
            field3: german.field3,
            field4: german.field4,
            category: german.category
        },
        english: {
            field1: english.field1,
            field2: english.field2,
            field3: english.field3,
            field4: english.field4,
            category: english.category
        }
    };
    
    // Check for specific issues I noticed
    if (key === '11' && english.field3 === 'Chocolate is high in calories') {
        issues.push(`Entry ${key}: "high in calories" should be "has many calories"`);
    }
    
    if (key === '21' && english.field3.includes('fireplace') && german.field3.includes('Kamin')) {
        issues.push(`Entry ${key}: "fireplace" should be "chimney" to match "Kamin"`);
    }
    
    // Store all entries for manual review
    console.log(`Entry ${key}:`);
    console.log(`  German: ${german.field1} | ${german.field2} | ${german.field3} | ${german.field4}`);
    console.log(`  English: ${english.field1} | ${english.field2} | ${english.field3} | ${english.field4}`);
    console.log(`  Category: ${german.category} -> ${english.category}`);
    console.log('---');
});

console.log('\nIssues found:');
issues.forEach(issue => console.log(issue));
