/**
 * Utility functions for the Sky Voyager game
 */
import * as THREE from 'three';

// Random number generator within a range
function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Create a simple color palette for the game
const COLORS = {
    SKY: 0x87CEEB,
    CLOUDS: 0xFFFFFF,
    AIRCRAFT_PRIMARY: 0xFF5252,
    AIRCRAFT_SECONDARY: 0x2196F3,
    STAR: 0xFFD700,
    OBSTACLE: 0x795548,
    ISLAND: 0x4CAF50,
    BOOST_TRAIL: 0xFF9800
};

// Sound effects manager
class SoundManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
    }

    load(name, url) {
        const audio = new Audio(url);
        this.sounds[name] = audio;
        return audio;
    }

    play(name, options = {}) {
        if (this.muted) return;
        
        const sound = this.sounds[name];
        if (!sound) return;
        
        if (options.loop) sound.loop = options.loop;
        if (options.volume !== undefined) sound.volume = options.volume;
        
        // Reset the audio to the beginning if it's already playing
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Audio play error:", e));
    }

    stop(name) {
        const sound = this.sounds[name];
        if (!sound) return;
        
        sound.pause();
        sound.currentTime = 0;
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
}

// Device detection for controls
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.matchMedia && window.matchMedia("(max-width: 768px)").matches);
}

// Collision detection between two objects
function checkCollision(obj1, obj2, tolerance = 1.0) {
    const distance = obj1.position.distanceTo(obj2.position);
    
    // Get collision radius from userData if available, or use geometry radius as fallback
    const radius1 = obj1.userData.collisionRadius || 
                   (obj1.geometry && obj1.geometry.parameters && obj1.geometry.parameters.radius) || 1;
    const radius2 = obj2.userData.collisionRadius || 
                   (obj2.geometry && obj2.geometry.parameters && obj2.geometry.parameters.radius) || 1;
    
    const combinedRadius = radius1 + radius2;
    
    return distance < (combinedRadius * tolerance);
}

// Show a temporary status message
function showStatus(message, duration = 2000) {
    const statusElement = document.getElementById('game-status');
    statusElement.textContent = message;
    statusElement.style.opacity = 1;
    
    setTimeout(() => {
        statusElement.style.opacity = 0;
    }, duration);
}

// Format large numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Export utilities
const GameUtils = {
    getRandomFloat,
    getRandomInt,
    COLORS,
    SoundManager,
    isMobileDevice,
    checkCollision,
    showStatus,
    formatNumber
};

export default GameUtils; 