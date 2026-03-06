const mammoth = require('mammoth');
const fs = require('fs');

async function extractBookList() {
    try {
        const result = await mammoth.extractRawText({ path: 'book list.docx' });
        const text = result.value;
        
        // Save to a text file for easy viewing
        fs.writeFileSync('book-list-extracted.txt', text, 'utf8');
        
        console.log('Book list extracted successfully!');
        console.log('\n--- CONTENT ---\n');
        console.log(text);
        console.log('\n--- END ---\n');
        
        if (result.messages.length > 0) {
            console.log('Warnings:', result.messages);
        }
    } catch (error) {
        console.error('Error extracting book list:', error);
    }
}

extractBookList();
