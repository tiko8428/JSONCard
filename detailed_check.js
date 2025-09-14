const fs = require('fs');

// Load both JSON files
const germanFile = JSON.parse(fs.readFileSync('./json_db/B2_de.json', 'utf8'));
const englishFile = JSON.parse(fs.readFileSync('./json_db/B2_en.json', 'utf8'));

// Common translation issues to check
const issues = [];

// Check specific patterns and common mistakes
Object.keys(germanFile).forEach(key => {
    const german = germanFile[key];
    const english = englishFile[key];
    
    if (!english) {
        issues.push(`Entry ${key}: Missing in English file`);
        return;
    }
    
    // Check for inconsistencies in word choices
    
    // Check if German field2 is plural form but English field2 seems wrong
    if (german.field2 && english.field2) {
        // Check for "roofs" vs "rooves" 
        if (key === '19' && english.field2 === 'the roofs') {
            issues.push(`Entry ${key}: "the roofs" should be "the rooves" (correct plural of roof)`);
        }
        
        // Check cinnamon translation
        if (key === '9') {
            if (german.field2 === 'die Zimtstange' && english.field2 !== 'the cinnamon stick') {
                issues.push(`Entry ${key}: German "die Zimtstange" (singular) but English has "the cinnamon sticks" (plural)`);
            }
        }
    }
    
    // Check for missing "the" articles in translations
    if (german.field1 && english.field1) {
        if (german.field1.startsWith('der ') || german.field1.startsWith('die ') || german.field1.startsWith('das ')) {
            if (!english.field1.startsWith('the ') && !english.field1.startsWith('to ')) {
                issues.push(`Entry ${key}: German has article but English missing "the" in field1: "${english.field1}"`);
            }
        }
    }
    
    // Check for capitalization issues in categories
    if (german.category && english.category) {
        const expectedTranslations = {
            'Ernährung': 'Nutrition',
            'Haus': 'House',
            'Körper': 'Body',
            'Kleidung': 'Clothing',
            'Transport': 'Transport',
            'Natur': 'Nature',
            'Zeit': 'Time',
            'Geld': 'Money',
            'Arbeit': 'Work',
            'Familie': 'Family',
            'Gesundheit': 'Health',
            'Bildung': 'Education',
            'Sport': 'Sports',
            'Musik': 'Music',
            'Kunst': 'Art',
            'Technologie': 'Technology',
            'Wetter': 'Weather',
            'Reisen': 'Travel',
            'Hobby': 'Hobby',
            'Kultur': 'Culture'
        };
        
        if (expectedTranslations[german.category] && english.category !== expectedTranslations[german.category]) {
            issues.push(`Entry ${key}: Category "${german.category}" should be "${expectedTranslations[german.category]}" not "${english.category}"`);
        }
    }
    
    // Look for common mistranslations
    if (german.field3 && english.field3) {
        // Check specific entries we haven't looked at yet
        if (key === '2' && german.field1 === 'das Leckermaul') {
            // "Leckermaul" could be translated as "sweet tooth" rather than "gourmand"
            if (english.field1 === 'the gourmand') {
                console.log(`Note: Entry ${key}: "das Leckermaul" might be better translated as "sweet tooth" rather than "gourmand"`);
            }
        }
    }
});

// Print all issues found
console.log('Issues found:');
issues.forEach(issue => console.log('- ' + issue));

if (issues.length === 0) {
    console.log('No major issues found in the systematic check.');
}
