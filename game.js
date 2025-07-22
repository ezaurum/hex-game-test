let scene, camera, renderer, raycaster, mouse;
let hexGrid = [];
let characters = [];
let selectedCharacter = null;
let isAttackMode = false;
let currentTurn = 'player';
let combatLog = [];
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

// Camera controls
let isLeftMouseDown = false;
let isRightMouseDown = false;
let mouseDownPosition = { x: 0, y: 0 };
let cameraTarget = { x: 0, y: 0, z: 0 };
let cameraAngle = { theta: 0, phi: Math.PI / 4 }; // theta: horizontal, phi: vertical
let cameraDistance = 20;

const HEX_SIZE = 1;
const GRID_WIDTH = 10;
const GRID_HEIGHT = 10;
const HEX_ROTATION = Math.PI / 6; // 30 degrees rotation for flat-top hexagons

class HexTile {
    constructor(q, r, s) {
        this.q = q;
        this.r = r;
        this.s = s;
        this.occupied = false;
        
        const geometry = new THREE.CylinderGeometry(HEX_SIZE, HEX_SIZE, 0.1, 6);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x44aa44,
            emissive: 0x222222,
            flatShading: false
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.layers.set(0); // Tiles on layer 0
        
        // Create border as line segments
        const borderGeometry = new THREE.BufferGeometry();
        const borderVertices = [];
        
        // Create thick lines by using LineSegments with multiple parallel lines
        const thickness = 0.04;
        const heights = [0.05, 0.055, 0.06, 0.065, 0.07]; // Multiple layers for thickness
        
        heights.forEach(height => {
            for (let i = 0; i < 6; i++) {
                const angle1 = (Math.PI / 2) + (Math.PI / 3) * i + HEX_ROTATION;
                const angle2 = (Math.PI / 2) + (Math.PI / 3) * ((i + 1) % 6) + HEX_ROTATION;
                
                borderVertices.push(
                    Math.cos(angle1) * HEX_SIZE, height, Math.sin(angle1) * HEX_SIZE,
                    Math.cos(angle2) * HEX_SIZE, height, Math.sin(angle2) * HEX_SIZE
                );
            }
        });
        
        borderGeometry.setAttribute('position', new THREE.Float32BufferAttribute(borderVertices, 3));
        
        const borderMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.5,
            linewidth: 2,
            depthTest: true,
            depthWrite: false
        });
        this.border = new THREE.LineSegments(borderGeometry, borderMaterial);
        this.border.layers.set(1); // Borders on layer 1
        
        const pos = this.hexToPixel();
        this.mesh.position.set(pos.x, 0, pos.y);
        this.border.position.set(pos.x, 0, pos.y);
        this.mesh.rotation.y = HEX_ROTATION;
        // Border doesn't need rotation as it's already created with correct orientation
        
        this.mesh.userData = { tile: this };
    }
    
    hexToPixel() {
        const x = HEX_SIZE * 3/2 * this.q;
        const y = HEX_SIZE * Math.sqrt(3) * (this.r + this.q/2);
        return { x, y };
    }
    
    highlight(color = 0xffff00) {
        this.mesh.material.emissive = new THREE.Color(color);
    }
    
    unhighlight() {
        this.mesh.material.emissive = new THREE.Color(0x222222);
    }
}

class Character {
    constructor(tile, isPlayer = true) {
        this.tile = tile;
        this.isPlayer = isPlayer;
        this.health = 100;
        this.maxHealth = 100;
        this.attack = 20;
        this.moveRange = 3;
        this.attackRange = 1;
        
        const geometry = new THREE.ConeGeometry(0.4, 1.2, 16);
        const material = new THREE.MeshPhongMaterial({ 
            color: isPlayer ? 0x2196F3 : 0xF44336,
            flatShading: false
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.layers.set(2); // Characters on layer 2
        
        const pos = tile.hexToPixel();
        this.mesh.position.set(pos.x, 0.7, pos.y);
        
        this.mesh.userData = { character: this };
        tile.occupied = true;
        
        this.createHealthBar();
    }
    
    createHealthBar() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        this.healthSprite = new THREE.Sprite(spriteMaterial);
        this.healthSprite.scale.set(1, 0.25, 1);
        this.healthSprite.position.y = 1.5;
        this.mesh.add(this.healthSprite);
        
        this.updateHealthBar();
    }
    
    updateHealthBar() {
        const canvas = this.healthSprite.material.map.image;
        const context = canvas.getContext('2d');
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = 'rgba(0,0,0,0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = '#333';
        context.fillRect(4, 4, canvas.width - 8, canvas.height - 8);
        
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.5 ? '#4CAF50' : 
                           healthPercent > 0.25 ? '#FFC107' : '#F44336';
        context.fillStyle = healthColor;
        context.fillRect(4, 4, (canvas.width - 8) * healthPercent, canvas.height - 8);
        
        this.healthSprite.material.map.needsUpdate = true;
    }
    
    moveTo(newTile) {
        if (newTile.occupied) return false;
        
        this.tile.occupied = false;
        this.tile = newTile;
        newTile.occupied = true;
        
        const pos = newTile.hexToPixel();
        const startPos = { x: this.mesh.position.x, z: this.mesh.position.z };
        const endPos = { x: pos.x, z: pos.y };
        
        const duration = 500;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const t = Math.min(elapsed / duration, 1);
            
            this.mesh.position.x = startPos.x + (endPos.x - startPos.x) * t;
            this.mesh.position.z = startPos.z + (endPos.z - startPos.z) * t;
            this.mesh.position.y = 0.7 + Math.sin(t * Math.PI) * 0.3;
            
            if (t < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
        return true;
    }
    
    attackTarget(target) {
        const damage = this.attack + Math.floor(Math.random() * 10) - 5;
        target.takeDamage(damage);
        
        addCombatLog(`${this.isPlayer ? '플레이어' : '적'} 공격! ${damage} 데미지`);
        
        const startScale = { x: 1, y: 1, z: 1 };
        const duration = 300;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const t = Math.min(elapsed / duration, 1);
            
            const scale = 1 + Math.sin(t * Math.PI) * 0.3;
            this.mesh.scale.set(scale, scale, scale);
            
            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                this.mesh.scale.set(1, 1, 1);
            }
        };
        
        animate();
    }
    
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        this.updateHealthBar();
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        addCombatLog(`${this.isPlayer ? '플레이어' : '적'} 캐릭터 사망!`);
        this.tile.occupied = false;
        scene.remove(this.mesh);
        
        const index = characters.indexOf(this);
        if (index > -1) {
            characters.splice(index, 1);
        }
        
        if (this === selectedCharacter) {
            selectedCharacter = null;
        }
    }
    
    getMovableTiles() {
        const movableTiles = [];
        const visited = new Set();
        const queue = [{ tile: this.tile, distance: 0 }];
        
        while (queue.length > 0) {
            const { tile, distance } = queue.shift();
            const key = `${tile.q},${tile.r}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            if (distance > 0 && distance <= this.moveRange && !tile.occupied) {
                movableTiles.push(tile);
            }
            
            if (distance < this.moveRange) {
                const neighbors = getNeighbors(tile);
                neighbors.forEach(neighbor => {
                    if (!visited.has(`${neighbor.q},${neighbor.r}`)) {
                        queue.push({ tile: neighbor, distance: distance + 1 });
                    }
                });
            }
        }
        
        return movableTiles;
    }
    
    getAttackableTiles() {
        const attackableTiles = [];
        const neighbors = getNeighbors(this.tile);
        
        neighbors.forEach(tile => {
            if (tile.occupied) {
                const target = characters.find(c => c.tile === tile);
                if (target && target.isPlayer !== this.isPlayer) {
                    attackableTiles.push(tile);
                }
            }
        });
        
        return attackableTiles;
    }
}

function getNeighbors(tile) {
    const directions = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];
    
    const neighbors = [];
    directions.forEach(dir => {
        const neighbor = hexGrid.find(t => 
            t.q === tile.q + dir.q && 
            t.r === tile.r + dir.r
        );
        if (neighbor) neighbors.push(neighbor);
    });
    
    return neighbors;
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2c3e50);
    scene.fog = new THREE.Fog(0x2c3e50, 10, 50);
    
    camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.layers.enable(0); // Enable layer 0 (tiles)
    camera.layers.enable(1); // Enable layer 1 (borders)
    camera.layers.enable(2); // Enable layer 2 (characters)
    updateCameraPosition();
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.getElementById('gameCanvas').appendChild(renderer.domElement);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);
    
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    createHexGrid();
    createCharacters();
    
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onMouseClick);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('wheel', onMouseWheel);
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    
    animate();
}

function createHexGrid() {
    for (let r = -Math.floor(GRID_HEIGHT/2); r < Math.floor(GRID_HEIGHT/2); r++) {
        for (let q = -Math.floor(GRID_WIDTH/2); q < Math.floor(GRID_WIDTH/2); q++) {
            const s = -q - r;
            const tile = new HexTile(q, r, s);
            hexGrid.push(tile);
            scene.add(tile.mesh);
            scene.add(tile.border);
        }
    }
}

function createCharacters() {
    const playerTile = hexGrid.find(t => t.q === -2 && t.r === 0);
    const player1 = new Character(playerTile, true);
    characters.push(player1);
    scene.add(player1.mesh);
    
    const playerTile2 = hexGrid.find(t => t.q === -2 && t.r === 1);
    const player2 = new Character(playerTile2, true);
    characters.push(player2);
    scene.add(player2.mesh);
    
    const enemyTile = hexGrid.find(t => t.q === 2 && t.r === 0);
    const enemy1 = new Character(enemyTile, false);
    characters.push(enemy1);
    scene.add(enemy1.mesh);
    
    const enemyTile2 = hexGrid.find(t => t.q === 2 && t.r === -1);
    const enemy2 = new Character(enemyTile2, false);
    characters.push(enemy2);
    scene.add(enemy2.mesh);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Handle left mouse drag for camera movement
    if (isLeftMouseDown) {
        const deltaX = event.clientX - mouseDownPosition.x;
        const deltaY = event.clientY - mouseDownPosition.y;
        
        // Left drag: Move camera position to follow cursor
        const moveSpeed = 0.05;
        
        // Get camera's right and up vectors in world space
        const cameraRight = new THREE.Vector3();
        const cameraUp = new THREE.Vector3();
        camera.getWorldDirection(new THREE.Vector3()); // Just to ensure matrices are updated
        camera.matrixWorld.extractBasis(cameraRight, cameraUp, new THREE.Vector3());
        
        // Project camera vectors to XZ plane for horizontal movement
        cameraRight.y = 0;
        cameraRight.normalize();
        
        // Use camera forward projected to XZ plane
        const cameraForward = new THREE.Vector3(
            camera.position.x - cameraTarget.x,
            0,
            camera.position.z - cameraTarget.z
        ).normalize();
        
        // Calculate perpendicular right vector on XZ plane
        const right = new THREE.Vector3(-cameraForward.z, 0, cameraForward.x);
        
        // Apply movement to match cursor direction
        cameraTarget.x += right.x * deltaX * moveSpeed - cameraForward.x * deltaY * moveSpeed;
        cameraTarget.z += right.z * deltaX * moveSpeed - cameraForward.z * deltaY * moveSpeed;
        
        updateCameraPosition();
        
        mouseDownPosition.x = event.clientX;
        mouseDownPosition.y = event.clientY;
        return;
    }
    
    // Handle right mouse drag for camera rotation
    if (isRightMouseDown) {
        const deltaX = event.clientX - mouseDownPosition.x;
        const deltaY = event.clientY - mouseDownPosition.y;
        
        // Right drag: Rotate camera
        const rotateSpeed = 0.005;
        cameraAngle.theta -= deltaX * rotateSpeed;
        cameraAngle.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, cameraAngle.phi + deltaY * rotateSpeed));
        
        updateCameraPosition();
        
        mouseDownPosition.x = event.clientX;
        mouseDownPosition.y = event.clientY;
        return;
    }
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    
    hexGrid.forEach(tile => tile.unhighlight());
    
    if (selectedCharacter) {
        if (isAttackMode) {
            const attackableTiles = selectedCharacter.getAttackableTiles();
            attackableTiles.forEach(tile => tile.highlight(0xff0000));
        } else {
            const movableTiles = selectedCharacter.getMovableTiles();
            movableTiles.forEach(tile => tile.highlight(0x00ff00));
        }
    }
    
    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.userData.tile) {
            object.userData.tile.highlight();
        }
    }
}

function onMouseClick(event) {
    // Only process left clicks for game interaction
    if (event.button !== 0) return;
    
    console.log('Mouse click event fired');
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    
    console.log('Intersects count:', intersects.length);
    
    if (intersects.length > 0) {
        const object = intersects[0].object;
        console.log('Clicked object:', object);
        console.log('Object userData:', object.userData);
        
        if (object.userData.character) {
            const character = object.userData.character;
            console.log('Character clicked:', character);
            console.log('Is player:', character.isPlayer);
            console.log('Current turn:', currentTurn);
            
            if (character.isPlayer && currentTurn === 'player') {
                selectedCharacter = character;
                isAttackMode = false;
                console.log('Character selected!');
                
                // Immediately show movable tiles
                hexGrid.forEach(tile => tile.unhighlight());
                const movableTiles = selectedCharacter.getMovableTiles();
                console.log('Movable tiles count:', movableTiles.length);
                movableTiles.forEach(tile => tile.highlight(0x00ff00));
            }
        } else if (object.userData.tile && selectedCharacter) {
            const tile = object.userData.tile;
            
            if (isAttackMode) {
                const attackableTiles = selectedCharacter.getAttackableTiles();
                if (attackableTiles.includes(tile)) {
                    const target = characters.find(c => c.tile === tile);
                    if (target) {
                        selectedCharacter.attackTarget(target);
                        endTurn();
                    }
                }
            } else {
                const movableTiles = selectedCharacter.getMovableTiles();
                if (movableTiles.includes(tile)) {
                    selectedCharacter.moveTo(tile);
                    endTurn();
                }
            }
        }
    }
}

function onKeyDown(event) {
    if (event.code === 'Space' && selectedCharacter) {
        isAttackMode = !isAttackMode;
    }
}

function endTurn() {
    selectedCharacter = null;
    isAttackMode = false;
    
    currentTurn = currentTurn === 'player' ? 'enemy' : 'player';
    document.getElementById('currentTurn').textContent = 
        currentTurn === 'player' ? '플레이어' : '적';
    
    if (currentTurn === 'enemy') {
        setTimeout(enemyTurn, 1000);
    }
}

function enemyTurn() {
    const enemyCharacters = characters.filter(c => !c.isPlayer);
    const playerCharacters = characters.filter(c => c.isPlayer);
    
    if (enemyCharacters.length === 0 || playerCharacters.length === 0) {
        checkGameEnd();
        return;
    }
    
    enemyCharacters.forEach(enemy => {
        const attackableTiles = enemy.getAttackableTiles();
        if (attackableTiles.length > 0) {
            const target = characters.find(c => c.tile === attackableTiles[0]);
            if (target) {
                enemy.attackTarget(target);
            }
        } else {
            const movableTiles = enemy.getMovableTiles();
            if (movableTiles.length > 0 && playerCharacters.length > 0) {
                const nearestPlayer = playerCharacters.reduce((nearest, player) => {
                    const distToPlayer = getDistance(enemy.tile, player.tile);
                    const distToNearest = nearest ? getDistance(enemy.tile, nearest.tile) : Infinity;
                    return distToPlayer < distToNearest ? player : nearest;
                }, null);
                
                if (nearestPlayer) {
                    const bestTile = movableTiles.reduce((best, tile) => {
                        const distToBest = best ? getDistance(tile, nearestPlayer.tile) : Infinity;
                        const distToTile = getDistance(tile, nearestPlayer.tile);
                        return distToTile < distToBest ? tile : best;
                    }, null);
                    
                    if (bestTile) {
                        enemy.moveTo(bestTile);
                    }
                }
            }
        }
    });
    
    setTimeout(() => {
        currentTurn = 'player';
        document.getElementById('currentTurn').textContent = '플레이어';
        checkGameEnd();
    }, 1000);
}

function getDistance(tile1, tile2) {
    return (Math.abs(tile1.q - tile2.q) + 
            Math.abs(tile1.q + tile1.r - tile2.q - tile2.r) + 
            Math.abs(tile1.r - tile2.r)) / 2;
}

function checkGameEnd() {
    const playerCharacters = characters.filter(c => c.isPlayer);
    const enemyCharacters = characters.filter(c => !c.isPlayer);
    
    if (playerCharacters.length === 0) {
        addCombatLog("게임 오버! 적이 승리했습니다.");
    } else if (enemyCharacters.length === 0) {
        addCombatLog("승리! 모든 적을 처치했습니다.");
    }
}

function addCombatLog(message) {
    combatLog.push(message);
    const logContent = document.getElementById('logContent');
    logContent.innerHTML = combatLog.slice(-10).join('<br>');
    logContent.scrollTop = logContent.scrollHeight;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseDown(event) {
    if (event.button === 0) { // Left mouse button
        isLeftMouseDown = true;
        mouseDownPosition.x = event.clientX;
        mouseDownPosition.y = event.clientY;
    } else if (event.button === 2) { // Right mouse button
        isRightMouseDown = true;
        mouseDownPosition.x = event.clientX;
        mouseDownPosition.y = event.clientY;
    }
}

function onMouseUp(event) {
    if (event.button === 0) { // Left mouse button
        isLeftMouseDown = false;
    } else if (event.button === 2) { // Right mouse button
        isRightMouseDown = false;
    }
}

function onMouseWheel(event) {
    event.preventDefault();
    
    const zoomSpeed = 0.1;
    const delta = event.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
    
    cameraDistance *= delta;
    cameraDistance = Math.max(10, Math.min(40, cameraDistance));
    
    updateCameraPosition();
}

function updateCameraPosition() {
    // Calculate camera position based on spherical coordinates
    camera.position.x = cameraTarget.x + cameraDistance * Math.sin(cameraAngle.phi) * Math.cos(cameraAngle.theta);
    camera.position.y = cameraTarget.y + cameraDistance * Math.cos(cameraAngle.phi);
    camera.position.z = cameraTarget.z + cameraDistance * Math.sin(cameraAngle.phi) * Math.sin(cameraAngle.theta);
    
    camera.lookAt(cameraTarget.x, cameraTarget.y, cameraTarget.z);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Calculate FPS
    const currentTime = performance.now();
    frameCount++;
    
    if (currentTime >= lastTime + 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
        document.getElementById('fps').textContent = fps;
    }
    
    renderer.render(scene, camera);
}

// Remove drawHexBorders function as we're now using 3D borders

init();