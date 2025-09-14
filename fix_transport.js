const fs = require('fs');

// Load the English JSON file
const data = JSON.parse(fs.readFileSync('./json_db/B2_en.json', 'utf8'));

// Fix Transport category capitalization
Object.keys(data).forEach(key => {
    if (data[key].category === 'transport') {
        data[key].category = 'Transport';
        console.log(`Fixed entry ${key}: transport -> Transport`);
    }
});

// Write back to file
fs.writeFileSync('./json_db/B2_en.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Transport category capitalization fixed!');
