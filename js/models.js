/**
 * 3D Models for the Sky Voyager game
 */
import * as THREE from 'three';
import GameUtils from './utils.js';

// Create a low-poly aircraft model
function createAircraft() {
    const aircraft = new THREE.Group();
    const { AIRCRAFT_PRIMARY, AIRCRAFT_SECONDARY } = GameUtils.COLORS;
    
    // Main body (fuselage)
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: AIRCRAFT_PRIMARY });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    aircraft.add(body);
    
    // Wings
    const wingGeometry = new THREE.BoxGeometry(7, 0.2, 1.5);
    const wingMaterial = new THREE.MeshPhongMaterial({ color: AIRCRAFT_SECONDARY });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.y = 0.1;
    aircraft.add(wings);
    
    // Tail
    const tailGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.2);
    const tail = new THREE.Mesh(tailGeometry, wingMaterial);
    tail.position.z = -1.8;
    tail.position.y = 0.6;
    aircraft.add(tail);
    
    // Vertical stabilizer
    const stabilizerGeometry = new THREE.BoxGeometry(0.2, 1.2, 1);
    const stabilizer = new THREE.Mesh(stabilizerGeometry, wingMaterial);
    stabilizer.position.z = -1.8;
    stabilizer.position.y = 1;
    aircraft.add(stabilizer);
    
    // Propeller
    const propellerGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.1);
    const propellerMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const propeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
    propeller.position.z = 2.1;
    aircraft.add(propeller);
    
    // Add a collision sphere for hit detection
    aircraft.userData = {
        collisionRadius: 2.0,
        type: 'aircraft'
    };
    
    // Add animation method
    aircraft.animatePropeller = function(delta) {
        propeller.rotation.y += delta * 15;
    };
    
    return aircraft;
}

// Create a star collectible
function createStar() {
    const { STAR } = GameUtils.COLORS;
    
    // Create a star shape using geometry
    const starGeometry = new THREE.OctahedronGeometry(1, 0);
    const starMaterial = new THREE.MeshPhongMaterial({ 
        color: STAR,
        emissive: STAR,
        emissiveIntensity: 0.5,
        shininess: 100
    });
    
    const star = new THREE.Mesh(starGeometry, starMaterial);
    
    // Add a point light to make the star glow
    const starLight = new THREE.PointLight(STAR, 1, 10);
    starLight.position.set(0, 0, 0);
    star.add(starLight);
    
    // Add animation method
    star.userData = {
        rotationSpeed: GameUtils.getRandomFloat(0.5, 2),
        collisionRadius: 1.2,
        type: 'star',
        collected: false
    };
    
    star.animate = function(delta) {
        this.rotation.y += delta * this.userData.rotationSpeed;
        this.rotation.x += delta * this.userData.rotationSpeed * 0.5;
        
        // Slight bobbing motion
        this.position.y += Math.sin(Date.now() * 0.002) * delta * 0.1;
    };
    
    return star;
}

// Create a cloud
function createCloud() {
    const { CLOUDS } = GameUtils.COLORS;
    const cloud = new THREE.Group();
    
    // Create several spheres clustered together
    const sphereGeometry = new THREE.SphereGeometry(1, 7, 7);
    const cloudMaterial = new THREE.MeshPhongMaterial({ 
        color: CLOUDS,
        transparent: true,
        opacity: 0.9
    });
    
    // Create main cloud puffs
    const positions = [
        [0, 0, 0],
        [1, 0.3, 0],
        [-1, 0.2, 0],
        [0.5, -0.2, 0.5],
        [-0.5, -0.3, -0.5],
        [0, 0.4, -0.7]
    ];
    
    positions.forEach(pos => {
        const size = GameUtils.getRandomFloat(0.7, 1.3);
        const puff = new THREE.Mesh(sphereGeometry, cloudMaterial);
        puff.position.set(pos[0], pos[1], pos[2]);
        puff.scale.set(size, size, size);
        cloud.add(puff);
    });
    
    // Scale the entire cloud
    const cloudScale = GameUtils.getRandomFloat(2, 5);
    cloud.scale.set(cloudScale, cloudScale * 0.6, cloudScale);
    
    // Add cloud data
    cloud.userData = {
        speed: GameUtils.getRandomFloat(0.5, 2),
        type: 'cloud'
    };
    
    return cloud;
}

// Create a floating island obstacle
function createIsland() {
    const { ISLAND, OBSTACLE } = GameUtils.COLORS;
    const island = new THREE.Group();
    
    // Create the main island body
    const islandGeometry = new THREE.CylinderGeometry(5, 7, 3, 8);
    const islandMaterial = new THREE.MeshPhongMaterial({ color: ISLAND });
    const islandBody = new THREE.Mesh(islandGeometry, islandMaterial);
    island.add(islandBody);
    
    // Add some rocks on top
    const rockCount = GameUtils.getRandomInt(2, 5);
    for (let i = 0; i < rockCount; i++) {
        const rockGeometry = new THREE.DodecahedronGeometry(
            GameUtils.getRandomFloat(0.5, 1.5), 0);
        const rockMaterial = new THREE.MeshPhongMaterial({ color: OBSTACLE });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        // Position the rock on top of the island
        const angle = Math.random() * Math.PI * 2;
        const radius = GameUtils.getRandomFloat(0, 3);
        rock.position.set(
            Math.cos(angle) * radius,
            1.5 + GameUtils.getRandomFloat(0, 1),
            Math.sin(angle) * radius
        );
        
        // Random rotation
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        island.add(rock);
    }
    
    // Add collision data
    island.userData = {
        collisionRadius: 7,
        type: 'obstacle',
        rotationSpeed: GameUtils.getRandomFloat(-0.1, 0.1)
    };
    
    // Add animation method
    island.animate = function(delta) {
        this.rotation.y += delta * this.userData.rotationSpeed;
    };
    
    return island;
}

// Create a ring to fly through
function createRing() {
    const ringGroup = new THREE.Group();
    
    // Create the ring torus
    const ringGeometry = new THREE.TorusGeometry(5, 0.5, 16, 32);
    const ringMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00E5FF,
        emissive: 0x00E5FF,
        emissiveIntensity: 0.5
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ringGroup.add(ring);
    
    // Add a point light
    const ringLight = new THREE.PointLight(0x00E5FF, 1, 15);
    ringGroup.add(ringLight);
    
    // Add user data
    ringGroup.userData = {
        type: 'ring',
        passed: false,
        collisionRadius: 5,
        points: 50
    };
    
    // Add animation method
    ringGroup.animate = function(delta) {
        ring.rotation.z += delta * 0.5;
        
        // Pulse the emissive intensity
        const intensity = 0.3 + Math.sin(Date.now() * 0.003) * 0.2;
        ringMaterial.emissiveIntensity = intensity;
    };
    
    return ringGroup;
}

// Create particle effects for engine trail
function createEngineTrail() {
    const particleCount = 100;
    const particles = new THREE.BufferGeometry();
    
    // Create arrays for particle positions and other attributes
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const lifetimes = new Float32Array(particleCount);
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        // All particles start at origin (will be updated in animation)
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        
        // White to orange colors
        colors[i * 3] = 1.0;     // R
        colors[i * 3 + 1] = 0.5; // G
        colors[i * 3 + 2] = 0.2; // B
        
        // Random sizes
        sizes[i] = GameUtils.getRandomFloat(0.1, 0.3);
        
        // Initialize with random lifetimes
        lifetimes[i] = GameUtils.getRandomFloat(0, 1);
    }
    
    // Add attributes to geometry
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create material with custom shader
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    // Create the particle system
    const particleSystem = new THREE.Points(particles, particleMaterial);
    
    // Add update method
    particleSystem.userData = {
        lifetimes,
        positions,
        colors,
        isBoost: false
    };
    
    particleSystem.updateParticles = function(delta, aircraft, isBoost) {
        const positions = this.geometry.attributes.position.array;
        const colors = this.geometry.attributes.color.array;
        const lifetimes = this.userData.lifetimes;
        this.userData.isBoost = isBoost;
        
        for (let i = 0; i < particleCount; i++) {
            // Update lifetime
            lifetimes[i] -= delta * (isBoost ? 2.0 : 1.0);
            
            // Reset dead particles
            if (lifetimes[i] <= 0) {
                lifetimes[i] = 1.0;
                
                // Position at the back of the aircraft
                const offset = new THREE.Vector3(
                    GameUtils.getRandomFloat(-0.2, 0.2),
                    GameUtils.getRandomFloat(-0.2, 0.2),
                    -2
                );
                offset.applyQuaternion(aircraft.quaternion);
                
                positions[i * 3] = aircraft.position.x + offset.x;
                positions[i * 3 + 1] = aircraft.position.y + offset.y;
                positions[i * 3 + 2] = aircraft.position.z + offset.z;
                
                // Set color based on boost
                if (isBoost) {
                    colors[i * 3] = 0.2;     // R
                    colors[i * 3 + 1] = 0.6; // G
                    colors[i * 3 + 2] = 1.0; // B
                } else {
                    colors[i * 3] = 1.0;     // R
                    colors[i * 3 + 1] = 0.5; // G
                    colors[i * 3 + 2] = 0.2; // B
                }
            } else {
                // Move particles backward
                positions[i * 3] -= delta * 5 * (isBoost ? 2 : 1);
                
                // Fade out
                const alpha = lifetimes[i];
                particleMaterial.opacity = alpha;
            }
        }
        
        // Update the geometry
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
    };
    
    return particleSystem;
}

// Export model creation functions
const GameModels = {
    createAircraft,
    createStar,
    createCloud,
    createIsland,
    createRing,
    createEngineTrail
};

export default GameModels; 