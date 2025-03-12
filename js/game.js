/**
 * Main game logic for Sky Voyager
 */
import * as THREE from 'three';
import GameUtils from './utils.js';
import GameModels from './models.js';

class SkyVoyagerGame {
    constructor() {
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.score = {
            distance: 0,
            stars: 0
        };
        
        // Game speed and difficulty
        this.speed = 20;
        this.baseSpeed = 20;
        this.boostSpeed = 40;
        this.isBoost = false;
        this.boostEnergy = 100;
        this.maxBoostEnergy = 100;
        this.boostRechargeRate = 10; // per second
        this.boostDrainRate = 30; // per second
        
        // Game objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.aircraft = null;
        this.engineTrail = null;
        this.objects = {
            stars: [],
            clouds: [],
            obstacles: [],
            rings: []
        };
        
        // Controls
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            boost: false
        };
        this.touchControls = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0
        };
        
        // Physics
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.drag = 0.95;
        this.maxSpeed = 0.5;
        this.gravity = new THREE.Vector3(0, -0.05, 0);
        
        // Game boundaries
        this.boundaries = {
            x: [-100, 100],
            y: [-50, 100],
            z: [-1000, 200]
        };
        
        // Spawn settings
        this.spawnDistance = -200;
        this.despawnDistance = 50;
        this.cloudCount = 30;
        this.starSpawnRate = 0.02;
        this.obstacleSpawnRate = 0.005;
        this.ringSpawnRate = 0.01;
        
        // Sound
        this.soundManager = new GameUtils.SoundManager();
        
        // Animation
        this.clock = new THREE.Clock();
        this.lastTime = 0;
        this.animationId = null;
        
        // Bind methods
        this.update = this.update.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleDeviceOrientation = this.handleDeviceOrientation.bind(this);
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(GameUtils.COLORS.SKY);
        this.scene.fog = new THREE.FogExp2(GameUtils.COLORS.SKY, 0.005);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, -10);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 200, 100);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Create aircraft
        this.aircraft = GameModels.createAircraft();
        this.aircraft.position.set(0, 0, 0);
        this.scene.add(this.aircraft);
        
        // Create engine trail
        this.engineTrail = GameModels.createEngineTrail();
        this.scene.add(this.engineTrail);
        
        // Initialize clouds
        this.initClouds();
        
        // Load sounds
        this.loadSounds();
        
        // Add event listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('resize', () => this.handleResize());
        
        // Mobile controls
        if (GameUtils.isMobileDevice()) {
            const touchArea = document.getElementById('touch-area');
            touchArea.addEventListener('touchstart', this.handleTouchStart);
            touchArea.addEventListener('touchmove', this.handleTouchMove);
            touchArea.addEventListener('touchend', this.handleTouchEnd);
            
            // Request device orientation permission on iOS
            if (typeof DeviceOrientationEvent !== 'undefined' && 
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                document.getElementById('start-button').addEventListener('click', async () => {
                    try {
                        const permission = await DeviceOrientationEvent.requestPermission();
                        if (permission === 'granted') {
                            window.addEventListener('deviceorientation', this.handleDeviceOrientation);
                        }
                    } catch (error) {
                        console.error('Error requesting device orientation permission:', error);
                    }
                });
            } else {
                window.addEventListener('deviceorientation', this.handleDeviceOrientation);
            }
            
            document.getElementById('mobile-controls').style.display = 'block';
        }
        
        // Set up UI event listeners
        document.getElementById('start-button').addEventListener('click', () => this.start());
        document.getElementById('restart-button').addEventListener('click', () => this.restart());
    }
    
    loadSounds() {
        // Load game sounds
        this.soundManager.load('engine', 'sounds/engine.mp3');
        this.soundManager.load('boost', 'sounds/boost.mp3');
        this.soundManager.load('collect', 'sounds/collect.mp3');
        this.soundManager.load('explosion', 'sounds/explosion.mp3');
        this.soundManager.load('ring', 'sounds/ring.mp3');
    }
    
    initClouds() {
        // Create initial clouds
        for (let i = 0; i < this.cloudCount; i++) {
            const cloud = GameModels.createCloud();
            
            // Position randomly in the sky
            cloud.position.set(
                GameUtils.getRandomFloat(this.boundaries.x[0], this.boundaries.x[1]),
                GameUtils.getRandomFloat(this.boundaries.y[0] + 20, this.boundaries.y[1]),
                GameUtils.getRandomFloat(this.spawnDistance, this.despawnDistance)
            );
            
            this.scene.add(cloud);
            this.objects.clouds.push(cloud);
        }
    }
    
    start() {
        if (this.isRunning) return;
        
        // Hide start screen
        document.getElementById('start-screen').classList.add('hidden');
        
        // Reset game state
        this.score.distance = 0;
        this.score.stars = 0;
        this.boostEnergy = this.maxBoostEnergy;
        this.isRunning = true;
        this.isPaused = false;
        
        // Start engine sound
        this.soundManager.play('engine', { loop: true, volume: 0.3 });
        
        // Start game loop
        this.clock.start();
        this.lastTime = this.clock.getElapsedTime();
        this.update();
    }
    
    restart() {
        // Clean up existing game objects
        this.cleanupGameObjects();
        
        // Reset aircraft position
        this.aircraft.position.set(0, 0, 0);
        this.aircraft.rotation.set(0, 0, 0);
        
        // Reset velocity and acceleration
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
        
        // Hide game over screen
        document.getElementById('game-over-screen').classList.add('hidden');
        
        // Start new game
        this.start();
    }
    
    cleanupGameObjects() {
        // Remove all stars, obstacles, and rings
        ['stars', 'obstacles', 'rings'].forEach(type => {
            this.objects[type].forEach(obj => {
                this.scene.remove(obj);
            });
            this.objects[type] = [];
        });
        
        // Reset clouds
        this.objects.clouds.forEach(cloud => {
            cloud.position.z = GameUtils.getRandomFloat(this.spawnDistance, this.despawnDistance);
        });
    }
    
    gameOver() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        // Play explosion sound
        this.soundManager.stop('engine');
        this.soundManager.stop('boost');
        this.soundManager.play('explosion', { volume: 0.5 });
        
        // Update final score
        document.getElementById('final-distance').textContent = GameUtils.formatNumber(Math.floor(this.score.distance));
        document.getElementById('final-stars').textContent = this.score.stars;
        
        // Show game over screen
        document.getElementById('game-over-screen').classList.remove('hidden');
        
        // Stop animation
        cancelAnimationFrame(this.animationId);
    }
    
    update() {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const time = this.clock.getElapsedTime();
        const delta = Math.min(time - this.lastTime, 0.1); // Cap delta time
        this.lastTime = time;
        
        if (this.isPaused) {
            this.animationId = requestAnimationFrame(this.update);
            return;
        }
        
        // Update score
        this.score.distance += this.speed * delta;
        this.updateUI();
        
        // Handle boost
        this.handleBoost(delta);
        
        // Update physics
        this.updatePhysics(delta);
        
        // Update aircraft
        this.updateAircraft(delta);
        
        // Update engine trail
        this.engineTrail.updateParticles(delta, this.aircraft, this.isBoost);
        
        // Update game objects
        this.updateGameObjects(delta);
        
        // Spawn new objects
        this.spawnObjects(delta);
        
        // Check collisions
        this.checkCollisions();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
        
        // Continue animation loop
        this.animationId = requestAnimationFrame(this.update);
    }
    
    updateUI() {
        // Update distance and stars display
        document.getElementById('distance-value').textContent = GameUtils.formatNumber(Math.floor(this.score.distance));
        document.getElementById('stars-value').textContent = this.score.stars;
    }
    
    handleBoost(delta) {
        if (this.keys.boost && this.boostEnergy > 0) {
            // Activate boost
            if (!this.isBoost) {
                this.isBoost = true;
                this.soundManager.play('boost', { loop: true, volume: 0.3 });
            }
            
            // Drain boost energy
            this.boostEnergy = Math.max(0, this.boostEnergy - this.boostDrainRate * delta);
            this.speed = this.boostSpeed;
        } else {
            // Deactivate boost
            if (this.isBoost) {
                this.isBoost = false;
                this.soundManager.stop('boost');
            }
            
            // Recharge boost energy
            this.boostEnergy = Math.min(this.maxBoostEnergy, this.boostEnergy + this.boostRechargeRate * delta);
            this.speed = this.baseSpeed;
        }
    }
    
    updatePhysics(delta) {
        // Reset acceleration
        this.acceleration.set(0, 0, 0);
        
        // Apply controls to acceleration
        if (this.keys.up) this.acceleration.y += 1;
        if (this.keys.down) this.acceleration.y -= 1;
        if (this.keys.left) this.acceleration.x -= 1;
        if (this.keys.right) this.acceleration.x += 1;
        
        // Normalize acceleration if moving diagonally
        if (this.acceleration.length() > 1) {
            this.acceleration.normalize();
        }
        
        // Scale acceleration
        this.acceleration.multiplyScalar(0.1);
        
        // Apply gravity
        this.acceleration.add(this.gravity);
        
        // Update velocity
        this.velocity.add(this.acceleration);
        this.velocity.multiplyScalar(this.drag);
        
        // Limit velocity
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
        
        // Update aircraft position
        this.aircraft.position.add(this.velocity);
        
        // Enforce boundaries
        this.enforceBoundaries();
    }
    
    enforceBoundaries() {
        // X boundaries (left/right)
        if (this.aircraft.position.x < this.boundaries.x[0]) {
            this.aircraft.position.x = this.boundaries.x[0];
            this.velocity.x = 0;
        } else if (this.aircraft.position.x > this.boundaries.x[1]) {
            this.aircraft.position.x = this.boundaries.x[1];
            this.velocity.x = 0;
        }
        
        // Y boundaries (up/down)
        if (this.aircraft.position.y < this.boundaries.y[0]) {
            this.aircraft.position.y = this.boundaries.y[0];
            this.velocity.y = 0;
            this.gameOver(); // Hit the ground
        } else if (this.aircraft.position.y > this.boundaries.y[1]) {
            this.aircraft.position.y = this.boundaries.y[1];
            this.velocity.y = 0;
        }
        
        // Z boundaries (forward/backward)
        if (this.aircraft.position.z < this.boundaries.z[0]) {
            this.aircraft.position.z = this.boundaries.z[0];
        } else if (this.aircraft.position.z > this.boundaries.z[1]) {
            this.aircraft.position.z = this.boundaries.z[1];
            this.velocity.z = 0;
        }
    }
    
    updateAircraft(delta) {
        // Animate propeller
        this.aircraft.animatePropeller(delta);
        
        // Tilt aircraft based on velocity
        const targetRotationX = -this.velocity.y * 0.5;
        const targetRotationZ = -this.velocity.x * 0.5;
        
        // Smoothly interpolate current rotation to target rotation
        this.aircraft.rotation.x += (targetRotationX - this.aircraft.rotation.x) * 0.1;
        this.aircraft.rotation.z += (targetRotationZ - this.aircraft.rotation.z) * 0.1;
        
        // Update camera to follow aircraft
        this.camera.position.x = this.aircraft.position.x;
        this.camera.position.y = this.aircraft.position.y + 5;
        this.camera.position.z = this.aircraft.position.z + 10;
        this.camera.lookAt(
            this.aircraft.position.x,
            this.aircraft.position.y,
            this.aircraft.position.z - 10
        );
    }
    
    updateGameObjects(delta) {
        // Move clouds forward
        this.objects.clouds.forEach(cloud => {
            cloud.position.z += this.speed * delta;
            
            // Respawn cloud if it's behind the camera
            if (cloud.position.z > this.despawnDistance) {
                cloud.position.z = this.spawnDistance;
                cloud.position.x = GameUtils.getRandomFloat(this.boundaries.x[0], this.boundaries.x[1]);
                cloud.position.y = GameUtils.getRandomFloat(this.boundaries.y[0] + 20, this.boundaries.y[1]);
            }
        });
        
        // Update and move stars
        for (let i = this.objects.stars.length - 1; i >= 0; i--) {
            const star = this.objects.stars[i];
            if (star.userData.collected) continue;
            
            star.position.z += this.speed * delta;
            star.animate(delta);
            
            // Remove star if it's behind the camera
            if (star.position.z > this.despawnDistance) {
                this.scene.remove(star);
                this.objects.stars.splice(i, 1);
            }
        }
        
        // Update and move obstacles
        for (let i = this.objects.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.objects.obstacles[i];
            obstacle.position.z += this.speed * delta;
            if (obstacle.animate) obstacle.animate(delta);
            
            // Remove obstacle if it's behind the camera
            if (obstacle.position.z > this.despawnDistance) {
                this.scene.remove(obstacle);
                this.objects.obstacles.splice(i, 1);
            }
        }
        
        // Update and move rings
        for (let i = this.objects.rings.length - 1; i >= 0; i--) {
            const ring = this.objects.rings[i];
            ring.position.z += this.speed * delta;
            if (ring.animate) ring.animate(delta);
            
            // Remove ring if it's behind the camera
            if (ring.position.z > this.despawnDistance) {
                this.scene.remove(ring);
                this.objects.rings.splice(i, 1);
            }
        }
    }
    
    spawnObjects(delta) {
        // Spawn stars randomly
        if (Math.random() < this.starSpawnRate) {
            const star = GameModels.createStar();
            star.position.set(
                GameUtils.getRandomFloat(this.boundaries.x[0] * 0.8, this.boundaries.x[1] * 0.8),
                GameUtils.getRandomFloat(this.boundaries.y[0] + 10, this.boundaries.y[1] * 0.8),
                this.spawnDistance
            );
            this.scene.add(star);
            this.objects.stars.push(star);
        }
        
        // Spawn obstacles (islands) randomly
        if (Math.random() < this.obstacleSpawnRate) {
            const island = GameModels.createIsland();
            island.position.set(
                GameUtils.getRandomFloat(this.boundaries.x[0] * 0.8, this.boundaries.x[1] * 0.8),
                GameUtils.getRandomFloat(this.boundaries.y[0] + 5, this.boundaries.y[1] * 0.5),
                this.spawnDistance
            );
            this.scene.add(island);
            this.objects.obstacles.push(island);
        }
        
        // Spawn rings randomly
        if (Math.random() < this.ringSpawnRate) {
            const ring = GameModels.createRing();
            ring.position.set(
                GameUtils.getRandomFloat(this.boundaries.x[0] * 0.6, this.boundaries.x[1] * 0.6),
                GameUtils.getRandomFloat(this.boundaries.y[0] + 15, this.boundaries.y[1] * 0.7),
                this.spawnDistance
            );
            // Rotate to face the player
            ring.rotation.y = Math.PI / 2;
            this.scene.add(ring);
            this.objects.rings.push(ring);
        }
    }
    
    checkCollisions() {
        // Check star collisions
        for (let i = this.objects.stars.length - 1; i >= 0; i--) {
            const star = this.objects.stars[i];
            if (star.userData.collected) continue;
            
            if (GameUtils.checkCollision(this.aircraft, star, 1.5)) {
                // Collect star
                star.userData.collected = true;
                this.score.stars++;
                
                // Play sound
                this.soundManager.play('collect', { volume: 0.5 });
                
                // Remove star
                this.scene.remove(star);
                this.objects.stars.splice(i, 1);
                
                // Show status
                GameUtils.showStatus('Star collected! +1', 1000);
            }
        }
        
        // Check obstacle collisions
        for (let i = 0; i < this.objects.obstacles.length; i++) {
            const obstacle = this.objects.obstacles[i];
            if (GameUtils.checkCollision(this.aircraft, obstacle, 0.8)) {
                this.gameOver();
                break;
            }
        }
        
        // Check ring collisions
        for (let i = 0; i < this.objects.rings.length; i++) {
            const ring = this.objects.rings[i];
            if (!ring.userData.passed && 
                Math.abs(this.aircraft.position.x - ring.position.x) < 5 &&
                Math.abs(this.aircraft.position.y - ring.position.y) < 5 &&
                Math.abs(this.aircraft.position.z - ring.position.z) < 1) {
                
                // Mark ring as passed
                ring.userData.passed = true;
                
                // Add points
                this.score.stars += 5;
                
                // Play sound
                this.soundManager.play('ring', { volume: 0.5 });
                
                // Show status
                GameUtils.showStatus('Ring bonus! +5 stars', 1000);
            }
        }
    }
    
    handleResize() {
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    handleKeyDown(event) {
        switch (event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keys.up = true;
                break;
            case 's':
            case 'arrowdown':
                this.keys.down = true;
                break;
            case 'a':
            case 'arrowleft':
                this.keys.left = true;
                break;
            case 'd':
            case 'arrowright':
                this.keys.right = true;
                break;
            case ' ':
                this.keys.boost = true;
                break;
            case 'p':
                this.isPaused = !this.isPaused;
                break;
        }
    }
    
    handleKeyUp(event) {
        switch (event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keys.up = false;
                break;
            case 's':
            case 'arrowdown':
                this.keys.down = false;
                break;
            case 'a':
            case 'arrowleft':
                this.keys.left = false;
                break;
            case 'd':
            case 'arrowright':
                this.keys.right = false;
                break;
            case ' ':
                this.keys.boost = false;
                break;
        }
    }
    
    handleTouchStart(event) {
        event.preventDefault();
        
        const touch = event.touches[0];
        this.touchControls.active = true;
        this.touchControls.startX = touch.clientX;
        this.touchControls.startY = touch.clientY;
        this.touchControls.currentX = touch.clientX;
        this.touchControls.currentY = touch.clientY;
        
        // Double tap for boost
        if (event.touches.length === 2) {
            this.keys.boost = true;
        }
    }
    
    handleTouchMove(event) {
        event.preventDefault();
        
        if (!this.touchControls.active) return;
        
        const touch = event.touches[0];
        this.touchControls.currentX = touch.clientX;
        this.touchControls.currentY = touch.clientY;
        
        // Calculate touch movement
        const deltaX = this.touchControls.currentX - this.touchControls.startX;
        const deltaY = this.touchControls.currentY - this.touchControls.startY;
        
        // Map touch movement to keys
        this.keys.left = deltaX < -20;
        this.keys.right = deltaX > 20;
        this.keys.up = deltaY < -20;
        this.keys.down = deltaY > 20;
    }
    
    handleTouchEnd(event) {
        event.preventDefault();
        
        this.touchControls.active = false;
        this.keys.left = false;
        this.keys.right = false;
        this.keys.up = false;
        this.keys.down = false;
        this.keys.boost = false;
    }
    
    handleDeviceOrientation(event) {
        if (!this.isRunning) return;
        
        // Get device orientation
        const beta = event.beta;  // -180 to 180 (front/back)
        const gamma = event.gamma; // -90 to 90 (left/right)
        
        if (beta === null || gamma === null) return;
        
        // Map orientation to controls
        this.keys.up = beta < -10;
        this.keys.down = beta > 10;
        this.keys.left = gamma < -10;
        this.keys.right = gamma > 10;
    }
}

export default SkyVoyagerGame; 