// Run this in browser console to update library area to 110
const facilities = JSON.parse(localStorage.getItem('facilities'));
if (facilities) {
    const library = facilities.find(f => f.type === 'library' || f.name.toLowerCase().includes('library'));
    if (library) {
        library.area = 110;
        localStorage.setItem('facilities', JSON.stringify(facilities));
        console.log('Library area updated to 110 ካሬ');
        console.log('Please refresh the page');
    } else {
        console.log('Library not found');
    }
} else {
    console.log('No facilities in localStorage');
}
