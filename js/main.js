/**
 * Main entry point for Sky Voyager game
 */
import SkyVoyagerGame from './game.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create sounds directory if it doesn't exist
    createSoundFiles();
    
    // Initialize game
    const game = new SkyVoyagerGame();
    game.init();
    
    // Expose game to window for debugging
    window.game = game;
    
    console.log('Sky Voyager initialized and ready to play!');
});

// Create placeholder sound files
function createSoundFiles() {
    // Create sounds directory
    const soundsDir = 'sounds';
    
    // Check if directory exists
    fetch(soundsDir)
        .then(response => {
            if (!response.ok) {
                console.log('Creating sounds directory...');
                return createDirectory(soundsDir);
            }
        })
        .catch(() => {
            console.log('Creating sounds directory...');
            return createDirectory(soundsDir);
        })
        .finally(() => {
            // Create placeholder sound files
            createPlaceholderSounds();
        });
}

// Create directory
function createDirectory(dir) {
    // This is a client-side application, so we can't create directories directly
    // Instead, we'll just log a message for the user
    console.log(`Please create a "${dir}" directory in the root of the project.`);
}

// Create placeholder sound files
function createPlaceholderSounds() {
    const sounds = [
        'engine.mp3',
        'boost.mp3',
        'collect.mp3',
        'explosion.mp3',
        'ring.mp3'
    ];
    
    // Log message for the user
    console.log('For the full game experience, please add the following sound files to the "sounds" directory:');
    sounds.forEach(sound => {
        console.log(`- ${sound}`);
    });
    
    // Note: In a real application, we would include these sound files
    // For this demo, we'll handle the case where sounds are missing
    
    // Add error handler for missing sounds
    window.addEventListener('error', (e) => {
        // Check if the error is related to loading a sound file
        if (e.target && e.target.tagName === 'AUDIO') {
            console.warn(`Could not load sound file: ${e.target.src}`);
            e.preventDefault(); // Prevent the error from appearing in the console
        }
    }, true);
} 