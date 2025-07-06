class Game {
    constructor(seed = null) {
        // Allowed values as per AGENT.md
        this.TERRAIN_TYPES = ['land', 'ocean', 'mountain', 'river'];
        this.DEVELOPMENT_TYPES = ['none', 'farm', 'mine', 'forest', 'town', 'city', 'castle'];
        this.ORDER_TYPES = ['move', 'attack', 'defend', 'build', null];
        this.RESOURCE_TYPES = ['gold', 'wood', 'food', 'metal'];
        
        this.MAP_SIZE = 10;
        this.INNER_SIZE = 10;
        this.turn = 0;
        this.nations = [];
        this.gameLog = [];
        this.isPlaying = false;
        this.autoPlayInterval = null;
        this.zoomedSquare = null; // {x, y} when zoomed into a square
        this.highlightedSquare = null; // {x, y, type: 'main'|'inner'}
        
        // Random seed control
        this.seed = seed || Math.floor(Math.random() * 1000000);
        this.random = this.createSeededRandom(this.seed);
        this.map = this.initializeMap();
        
        this.initializeGame();
        this.render();
    }
    
    displaySeed() {
        const seedElement = document.getElementById('currentSeed');
        if (seedElement) {
            seedElement.textContent = this.seed;
        }
    }
    
    createSeededRandom(seed) {
        let x = Math.sin(seed) * 10000;
        return function() {
            x = Math.sin(x) * 10000;
            return x - Math.floor(x);
        };
    }
    
    validateTerrain(terrain) {
        if (!this.TERRAIN_TYPES.includes(terrain)) {
            console.error(`Invalid terrain type: ${terrain}. Must be one of: ${this.TERRAIN_TYPES.join(', ')}`);
            return 'land'; // Default fallback
        }
        return terrain;
    }
    
    validateDevelopment(development) {
        if (!this.DEVELOPMENT_TYPES.includes(development)) {
            console.error(`Invalid development type: ${development}. Must be one of: ${this.DEVELOPMENT_TYPES.join(', ')}`);
            return 'none'; // Default fallback
        }
        return development;
    }
    
    validateOrder(order) {
        if (!this.ORDER_TYPES.includes(order)) {
            console.error(`Invalid order type: ${order}. Must be one of: ${this.ORDER_TYPES.join(', ')}`);
            return null; // Default fallback
        }
        return order;
    }
    
    initializeMap() {
        const map = [];
        for (let i = 0; i < this.MAP_SIZE; i++) {
            map[i] = [];
            for (let j = 0; j < this.MAP_SIZE; j++) {
                map[i][j] = {
                    owner: null,
                    terrain: this.validateTerrain('land'),
                    resources: {
                        gold: 0,
                        wood: 0,
                        food: 0,
                        metal: 0
                    },
                    development: this.validateDevelopment('none'),
                    army: null,
                    population: 0,
                    innerGrid: this.generateInnerGrid()
                };
            }
        }
        return map;
    }
    
    generateInnerGrid() {
        const inner = [];
        for (let i = 0; i < this.INNER_SIZE; i++) {
            inner[i] = [];
            for (let j = 0; j < this.INNER_SIZE; j++) {
                const terrainRoll = this.random();
                let terrain;
                if (terrainRoll < 0.1) terrain = 'mountain';
                else if (terrainRoll < 0.25) terrain = 'river';
                else if (terrainRoll < 0.30) terrain = 'ocean';
                else terrain = 'land';
                
                inner[i][j] = {
                    terrain: this.validateTerrain(terrain),
                    resources: this.random() < 0.2 ? this.getRandomResource() : null,
                    development: this.validateDevelopment('none'),
                    army: null,
                    population: 0,
                    road: false,
                    level: 1 // for towns/cities
                };
            }
        }
        return inner;
    }
    
    getRandomResource() {
        return this.RESOURCE_TYPES[Math.floor(this.random() * this.RESOURCE_TYPES.length)];
    }
    
    initializeGame() {
        // Create nations with minimum distance
        const nationCount = 4;
        const colors = ['🟥', '🟦', '🟩', '🟨'];
        const nationNames = ['Red Empire', 'Blue Kingdom', 'Green Republic', 'Yellow Federation'];
        
        for (let i = 0; i < nationCount; i++) {
            const nation = new Nation(i, nationNames[i], colors[i]);
            this.nations.push(nation);
        }
        
        // Place nations on map with minimum distance
        this.placeNationsOnMap();
        
        // Generate terrain features
        this.generateTerrain();
        
        // Distribute initial resources
        this.distributeResources();
        
        this.log(`Game initialized with ${nationCount} nations (seed: ${this.seed})`);
    }
    
    placeNationsOnMap() {
        const minDistance = 3;
        const positions = [];
        
        for (let nation of this.nations) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const x = Math.floor(this.random() * this.MAP_SIZE);
                const y = Math.floor(this.random() * this.MAP_SIZE);
                
                let validPosition = true;
                for (let pos of positions) {
                    const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
                    if (distance < minDistance) {
                        validPosition = false;
                        break;
                    }
                }
                
                if (validPosition) {
                    this.map[x][y].owner = nation.id;
                    this.map[x][y].development = this.validateDevelopment('city');
                    this.map[x][y].population = 1000;
                    
                    // Place a city in the center of the inner grid
                    const centerX = Math.floor(this.INNER_SIZE / 2);
                    const centerY = Math.floor(this.INNER_SIZE / 2);
                    this.map[x][y].innerGrid[centerX][centerY].development = this.validateDevelopment('city');
                    this.map[x][y].innerGrid[centerX][centerY].population = 1000;
                    
                    nation.capital = { x, y };
                    nation.territory.push({ x, y });
                    positions.push({ x, y });
                    placed = true;
                    this.log(`${nation.name} established capital at (${x}, ${y})`);
                }
                attempts++;
            }
        }
    }
    
    generateTerrain() {
        // Generate oceans
        for (let i = 0; i < 3; i++) {
            const startX = Math.floor(this.random() * this.MAP_SIZE);
            const startY = Math.floor(this.random() * this.MAP_SIZE);
            this.generateOcean(startX, startY);
        }
        
        // Generate rivers
        for (let i = 0; i < 2; i++) {
            this.generateRiver();
        }
        
        // Generate mountains
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(this.random() * this.MAP_SIZE);
            const y = Math.floor(this.random() * this.MAP_SIZE);
            if (!this.map[x][y].owner) {
                this.map[x][y].terrain = this.validateTerrain('mountain');
            }
        }
    }
    
    generateOcean(startX, startY) {
        const size = Math.floor(this.random() * 3) + 1;
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const x = startX + i;
                const y = startY + j;
                if (x < this.MAP_SIZE && y < this.MAP_SIZE && !this.map[x][y].owner) {
                    this.map[x][y].terrain = 'ocean';
                }
            }
        }
    }
    
    generateRiver() {
        const startX = Math.floor(this.random() * this.MAP_SIZE);
        const startY = 0;
        let x = startX;
        let y = startY;
        
        while (y < this.MAP_SIZE - 1) {
            if (!this.map[x][y].owner) {
                this.map[x][y].terrain = 'river';
                this.map[x][y].resources.food += 2;
            }
            
            y++;
            if (this.random() < 0.3) {
                x += this.random() < 0.5 ? -1 : 1;
                x = Math.max(0, Math.min(this.MAP_SIZE - 1, x));
            }
        }
    }
    
    distributeResources() {
        for (let i = 0; i < this.MAP_SIZE; i++) {
            for (let j = 0; j < this.MAP_SIZE; j++) {
                const cell = this.map[i][j];
                
                // Base resource generation
                if (cell.terrain === 'land') {
                    cell.resources.wood = Math.floor(this.random() * 5) + 1;
                    cell.resources.food = Math.floor(this.random() * 3) + 1;
                }
                
                if (cell.terrain === 'mountain') {
                    cell.resources.metal = Math.floor(this.random() * 8) + 2;
                }
                
                if (cell.terrain === 'river') {
                    cell.resources.food = Math.floor(this.random() * 6) + 3;
                }
                
                // Random gold deposits
                if (this.random() < 0.15) {
                    cell.resources.gold = Math.floor(this.random() * 3) + 1;
                }
            }
        }
    }
    
    nextTurn() {
        this.turn++;
        this.log(`--- Turn ${this.turn} ---`);
        
        // Process each nation
        for (let nation of this.nations) {
            this.processNationTurn(nation);
        }
        
        // Process battles
        this.processBattles();
        
        // Update display
        this.render();
    }
    
    processNationTurn(nation) {
        // Collect resources
        this.collectResources(nation);
        
        // Pay upkeep
        this.payUpkeep(nation);
        
        // Make decisions
        this.makeNationDecisions(nation);
        
        // Update statistics
        this.updateNationStats(nation);
    }
    
    collectResources(nation) {
        const collected = { gold: 0, wood: 0, food: 0, metal: 0 };
        
        for (let territory of nation.territory) {
            const cell = this.map[territory.x][territory.y];
            
            // Base collection from main cell
            collected.gold += cell.resources.gold;
            collected.wood += cell.resources.wood;
            collected.food += cell.resources.food;
            collected.metal += cell.resources.metal;
            
            // Development bonuses from main cell
            if (cell.development === 'farm') {
                collected.food += 3;
            } else if (cell.development === 'mine') {
                collected.metal += 2;
            } else if (cell.development === 'forest') {
                collected.wood += 2;
            }
            
            // Collect from inner grid developments
            for (let i = 0; i < this.INNER_SIZE; i++) {
                for (let j = 0; j < this.INNER_SIZE; j++) {
                    const innerCell = cell.innerGrid[i][j];
                    
                    if (innerCell.development === 'farm') {
                        collected.food += 1;
                    } else if (innerCell.development === 'mine') {
                        collected.metal += innerCell.terrain === 'mountain' ? 2 : 1;
                    } else if (innerCell.development === 'forest') {
                        collected.wood += 1;
                    } else if (innerCell.development === 'town') {
                        collected.gold += Math.floor(innerCell.population / 100);
                    } else if (innerCell.development === 'city') {
                        collected.gold += Math.floor(innerCell.population / 50);
                    }
                }
            }
        }
        
        nation.resources.gold += collected.gold;
        nation.resources.wood += collected.wood;
        nation.resources.food += collected.food;
        nation.resources.metal += collected.metal;
    }
    
    payUpkeep(nation) {
        const upkeep = nation.armies.length * 2 + nation.territory.length;
        nation.resources.gold = Math.max(0, nation.resources.gold - upkeep);
    }
    
    makeNationDecisions(nation) {
        // Update diplomacy
        this.updateDiplomacy(nation);
        
        // Handle trade offers
        this.processTradeOffers(nation);
        
        // Make trade offers to other nations
        if (this.random() < 0.3) {
            this.makeTradeOffer(nation);
        }
        
        // Move armies
        this.moveArmies(nation);
        
        // Simple AI decisions
        if (nation.resources.gold > 50 && this.random() < 0.3) {
            this.createArmy(nation);
        }
        
        if (nation.resources.gold > 30 && this.random() < 0.2) {
            this.developLand(nation);
        }
        
        if (this.random() < 0.4) {
            this.expandTerritory(nation);
        }
        
        // Develop inner grids
        if (this.random() < 0.6) {
            this.developInnerGrid(nation);
        }
    }
    
    updateDiplomacy(nation) {
        for (let otherNation of this.nations) {
            if (otherNation.id === nation.id) continue;
            
            if (!nation.diplomacy[otherNation.id]) {
                nation.diplomacy[otherNation.id] = 'neutral';
            }
            
            // Random chance to change diplomatic relations
            if (this.random() < 0.05) {
                const currentRelation = nation.diplomacy[otherNation.id];
                const relations = ['neutral', 'trade', 'war', 'peace'];
                const newRelation = relations[Math.floor(this.random() * relations.length)];
                
                if (currentRelation !== newRelation) {
                    nation.diplomacy[otherNation.id] = newRelation;
                    otherNation.diplomacy[nation.id] = newRelation;
                    this.log(`${nation.name} and ${otherNation.name} relations changed to ${newRelation}`);
                }
            }
        }
    }
    
    makeTradeOffer(nation) {
        const otherNations = this.nations.filter(n => n.id !== nation.id);
        if (otherNations.length === 0) return;
        
        const partner = otherNations[Math.floor(this.random() * otherNations.length)];
        
        // Don't trade with enemies
        if (nation.diplomacy[partner.id] === 'war') return;
        
        // Determine what to trade
        const resources = ['gold', 'wood', 'food', 'metal'];
        const offering = resources[Math.floor(this.random() * resources.length)];
        const wanting = resources[Math.floor(this.random() * resources.length)];
        
        if (offering === wanting) return;
        if (nation.resources[offering] < 20) return;
        
        const offer = {
            from: nation.id,
            to: partner.id,
            offering: offering,
            offeringAmount: Math.floor(nation.resources[offering] * 0.2),
            wanting: wanting,
            wantingAmount: Math.floor(this.random() * 30) + 10,
            turn: this.turn
        };
        
        partner.tradeOffers.push(offer);
        this.log(`${nation.name} offers ${offer.offeringAmount} ${offering} to ${partner.name} for ${offer.wantingAmount} ${wanting}`);
    }
    
    processTradeOffers(nation) {
        for (let i = nation.tradeOffers.length - 1; i >= 0; i--) {
            const offer = nation.tradeOffers[i];
            const partner = this.nations[offer.from];
            
            // Remove old offers
            if (this.turn - offer.turn > 3) {
                nation.tradeOffers.splice(i, 1);
                continue;
            }
            
            // Decide whether to accept
            const needsResource = nation.resources[offer.wanting] < 30;
            const hasResource = nation.resources[offer.offering] >= offer.offeringAmount;
            const goodRelations = nation.diplomacy[partner.id] === 'trade' || nation.diplomacy[partner.id] === 'peace';
            
            if (needsResource && hasResource && (goodRelations || this.random() < 0.3)) {
                // Accept trade
                nation.resources[offer.wanting] += offer.offeringAmount;
                nation.resources[offer.offering] -= offer.wantingAmount;
                partner.resources[offer.offering] -= offer.offeringAmount;
                partner.resources[offer.wanting] += offer.wantingAmount;
                
                this.log(`${nation.name} accepted trade with ${partner.name}: ${offer.offeringAmount} ${offer.offering} for ${offer.wantingAmount} ${offer.wanting}`);
                nation.tradeOffers.splice(i, 1);
            }
        }
    }
    
    moveArmies(nation) {
        for (let army of nation.armies) {
            if (army.movementPoints <= 0) {
                army.movementPoints = 3; // Reset movement points
                continue;
            }
            
            // Simple AI army behavior
            const enemies = this.findNearbyEnemies(army);
            const neutralTargets = this.findNearbyNeutralLand(army);
            
            if (enemies.length > 0 && nation.diplomacy[enemies[0].nationId] === 'war') {
                // Attack nearby enemies
                this.moveArmyTowards(army, enemies[0].x, enemies[0].y);
            } else if (neutralTargets.length > 0) {
                // Expand into neutral territory
                const target = neutralTargets[Math.floor(this.random() * neutralTargets.length)];
                this.moveArmyTowards(army, target.x, target.y);
            } else if (this.random() < 0.3) {
                // Random patrol movement
                this.moveArmyRandomly(army);
            }
        }
    }
    
    findNearbyEnemies(army) {
        const enemies = [];
        const directions = [[-1,0], [1,0], [0,-1], [0,1]];
        
        for (let dir of directions) {
            const x = army.x + dir[0];
            const y = army.y + dir[1];
            if (x >= 0 && x < this.MAP_SIZE && y >= 0 && y < this.MAP_SIZE) {
                const cell = this.map[x][y];
                if (cell.owner !== null && cell.owner !== army.nationId) {
                    enemies.push({ x, y, nationId: cell.owner });
                }
            }
        }
        
        return enemies;
    }
    
    findNearbyNeutralLand(army) {
        const neutral = [];
        const directions = [[-1,0], [1,0], [0,-1], [0,1]];
        
        for (let dir of directions) {
            const x = army.x + dir[0];
            const y = army.y + dir[1];
            if (x >= 0 && x < this.MAP_SIZE && y >= 0 && y < this.MAP_SIZE) {
                const cell = this.map[x][y];
                if (cell.owner === null && cell.terrain !== 'ocean' && cell.terrain !== 'mountain') {
                    neutral.push({ x, y });
                }
            }
        }
        
        return neutral;
    }
    
    moveArmyTowards(army, targetX, targetY) {
        if (army.movementPoints <= 0) return;
        
        let newX = army.x;
        let newY = army.y;
        
        if (army.x < targetX) newX++;
        else if (army.x > targetX) newX--;
        else if (army.y < targetY) newY++;
        else if (army.y > targetY) newY--;
        
        this.moveArmy(army, newX, newY);
    }
    
    moveArmyRandomly(army) {
        if (army.movementPoints <= 0) return;
        
        const directions = [[-1,0], [1,0], [0,-1], [0,1]];
        const dir = directions[Math.floor(this.random() * directions.length)];
        const newX = army.x + dir[0];
        const newY = army.y + dir[1];
        
        if (newX >= 0 && newX < this.MAP_SIZE && newY >= 0 && newY < this.MAP_SIZE) {
            this.moveArmy(army, newX, newY);
        }
    }
    
    moveArmy(army, newX, newY) {
        if (newX < 0 || newX >= this.MAP_SIZE || newY < 0 || newY >= this.MAP_SIZE) return;
        
        const targetCell = this.map[newX][newY];
        
        // Check if movement is blocked by mountains
        if (targetCell.terrain === 'mountain') return;
        
        // Remove army from current position
        if (army.innerX !== null && army.innerY !== null) {
            this.map[army.x][army.y].innerGrid[army.innerX][army.innerY].army = null;
        }
        
        // Check for battle
        if (targetCell.owner !== null && targetCell.owner !== army.nationId) {
            this.initiateBattle(army, newX, newY);
            return;
        }
        
        // Move army
        army.x = newX;
        army.y = newY;
        army.movementPoints--;
        
        // If entering neutral territory, claim it
        if (targetCell.owner === null) {
            targetCell.owner = army.nationId;
            const nation = this.nations[army.nationId];
            nation.territory.push({ x: newX, y: newY });
            this.log(`${nation.name} army conquered neutral territory at (${newX}, ${newY})`);
        }
        
        // Place army in new location
        const availableCells = this.getNearbyEmptyCells(targetCell, 5, 5); // Center of grid
        if (availableCells.length > 0) {
            const placement = availableCells[0];
            targetCell.innerGrid[placement.x][placement.y].army = army;
            army.innerX = placement.x;
            army.innerY = placement.y;
        }
        
        // Adjust speed based on terrain
        if (targetCell.terrain === 'ocean') {
            army.movementPoints = Math.max(0, army.movementPoints - 3); // 0.25x speed
        } else if (targetCell.terrain === 'river') {
            // 3x speed on rivers - gain movement points
            army.movementPoints = Math.min(3, army.movementPoints + 2);
        }
    }
    
    createArmy(nation) {
        if (nation.territory.length === 0) return;
        
        // Find towns/cities that can spawn armies
        const spawnPoints = [];
        for (let territory of nation.territory) {
            const mainCell = this.map[territory.x][territory.y];
            for (let i = 0; i < this.INNER_SIZE; i++) {
                for (let j = 0; j < this.INNER_SIZE; j++) {
                    const innerCell = mainCell.innerGrid[i][j];
                    if ((innerCell.development === 'town' || innerCell.development === 'city') && 
                        innerCell.population >= 100) {
                        spawnPoints.push({ 
                            mainX: territory.x, 
                            mainY: territory.y, 
                            innerX: i, 
                            innerY: j,
                            level: innerCell.level || 1,
                            type: innerCell.development
                        });
                    }
                }
            }
        }
        
        if (spawnPoints.length === 0) return;
        
        const spawnPoint = spawnPoints[Math.floor(this.random() * spawnPoints.length)];
        const maxLevel = spawnPoint.type === 'town' ? 3 : 10;
        const cost = 15;
        
        if (nation.resources.gold >= cost && nation.resources.wood >= 5 && nation.resources.food >= 5 && nation.resources.metal >= 5) {
            const army = new Army(nation.id, spawnPoint.mainX, spawnPoint.mainY, spawnPoint.innerX, spawnPoint.innerY);
            army.level = Math.min(maxLevel, Math.floor(nation.resources.gold / 20) + 1);
            
            nation.armies.push(army);
            nation.resources.gold -= cost;
            nation.resources.wood -= 5;
            nation.resources.food -= 5;
            nation.resources.metal -= 5;
            
            // Place army near the spawning settlement
            const mainCell = this.map[spawnPoint.mainX][spawnPoint.mainY];
            const availableCells = this.getNearbyEmptyCells(mainCell, spawnPoint.innerX, spawnPoint.innerY);
            
            if (availableCells.length > 0) {
                const placement = availableCells[Math.floor(this.random() * availableCells.length)];
                mainCell.innerGrid[placement.x][placement.y].army = army;
                army.innerX = placement.x;
                army.innerY = placement.y;
                this.log(`${nation.name} created level ${army.level} army at inner (${placement.x}, ${placement.y}) in square (${spawnPoint.mainX}, ${spawnPoint.mainY})`);
            } else {
                this.log(`${nation.name} created level ${army.level} army at (${spawnPoint.mainX}, ${spawnPoint.mainY})`);
            }
        }
    }
    
    getNearbyEmptyCells(mainCell, centerX, centerY) {
        const available = [];
        const directions = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
        
        for (let dir of directions) {
            const x = centerX + dir[0];
            const y = centerY + dir[1];
            if (x >= 0 && x < this.INNER_SIZE && y >= 0 && y < this.INNER_SIZE) {
                const cell = mainCell.innerGrid[x][y];
                if (cell.terrain === 'land' && !cell.army && cell.development === 'none') {
                    available.push({ x, y });
                }
            }
        }
        
        return available;
    }
    
    developLand(nation) {
        const undeveloped = nation.territory.filter(t => 
            this.map[t.x][t.y].development === 'none'
        );
        
        if (undeveloped.length === 0) return;
        
        const target = undeveloped[Math.floor(this.random() * undeveloped.length)];
        const cell = this.map[target.x][target.y];
        
        const developments = ['farm', 'mine', 'forest'];
        cell.development = developments[Math.floor(this.random() * developments.length)];
        nation.resources.gold -= 20;
        
        this.log(`${nation.name} developed ${cell.development} at (${target.x}, ${target.y})`);
    }
    
    expandTerritory(nation) {
        const borders = this.getBorderTerritories(nation);
        
        if (borders.length === 0) return;
        
        const target = borders[Math.floor(this.random() * borders.length)];
        const cell = this.map[target.x][target.y];
        
        if (!cell.owner && cell.terrain !== 'ocean' && cell.terrain !== 'mountain') {
            cell.owner = nation.id;
            nation.territory.push(target);
            this.log(`${nation.name} expanded to (${target.x}, ${target.y})`);
        }
    }
    
    getBorderTerritories(nation) {
        const borders = [];
        const directions = [[-1,0], [1,0], [0,-1], [0,1]];
        
        for (let territory of nation.territory) {
            for (let dir of directions) {
                const x = territory.x + dir[0];
                const y = territory.y + dir[1];
                
                if (x >= 0 && x < this.MAP_SIZE && y >= 0 && y < this.MAP_SIZE) {
                    if (!this.map[x][y].owner) {
                        borders.push({ x, y });
                    }
                }
            }
        }
        
        return borders;
    }
    
    developInnerGrid(nation) {
        if (nation.territory.length === 0) return;
        
        // Don't develop if can't afford it
        if (nation.resources.gold < 10) return;
        
        // Pick a random territory to develop
        const territory = nation.territory[Math.floor(this.random() * nation.territory.length)];
        const mainCell = this.map[territory.x][territory.y];
        
        // Build roads first if there are towns/cities without connections
        if (this.random() < 0.4) {
            this.buildRoads(nation, territory.x, territory.y);
        }
        
        // Find undeveloped land cells in the inner grid
        const undeveloped = [];
        for (let i = 0; i < this.INNER_SIZE; i++) {
            for (let j = 0; j < this.INNER_SIZE; j++) {
                const innerCell = mainCell.innerGrid[i][j];
                if (innerCell.terrain === 'land' && innerCell.development === 'none') {
                    undeveloped.push({ x: i, y: j });
                }
            }
        }
        
        if (undeveloped.length === 0) return;
        
        // Develop a random cell
        const target = undeveloped[Math.floor(this.random() * undeveloped.length)];
        const innerCell = mainCell.innerGrid[target.x][target.y];
        
        // AI decision on what to build
        const developments = [];
        if (nation.resources.food < 50) developments.push('farm');
        if (nation.resources.wood < 30) developments.push('forest');
        if (nation.resources.metal < 20) developments.push('mine');
        if (this.random() < 0.3) developments.push('town');
        
        if (developments.length === 0) {
            developments.push('farm', 'forest', 'town');
        }
        
        const development = developments[Math.floor(this.random() * developments.length)];
        
        // Validate development choice
        if (development === 'mine' && innerCell.terrain !== 'mountain') {
            // Can only build efficient mines on mountains, use farm instead
            innerCell.development = 'farm';
        } else {
            innerCell.development = development;
        }
        
        if (innerCell.development === 'town') {
            innerCell.population = 100 + Math.floor(this.random() * 200);
            innerCell.level = 1;
        }
        
        // Cost resources BEFORE logging
        nation.resources.gold -= 10;
        
        this.log(`${nation.name} built ${innerCell.development} at inner (${target.x}, ${target.y}) in square (${territory.x}, ${territory.y})`);
    }
    
    buildRoads(nation, mainX, mainY) {
        const mainCell = this.map[mainX][mainY];
        
        // Find all towns and cities in this square
        const settlements = [];
        for (let i = 0; i < this.INNER_SIZE; i++) {
            for (let j = 0; j < this.INNER_SIZE; j++) {
                const innerCell = mainCell.innerGrid[i][j];
                if (innerCell.development === 'town' || innerCell.development === 'city') {
                    settlements.push({ x: i, y: j });
                }
            }
        }
        
        if (settlements.length < 2) return;
        
        // Build roads between settlements using simple pathfinding
        for (let i = 0; i < settlements.length - 1; i++) {
            const start = settlements[i];
            const end = settlements[i + 1];
            this.buildRoadPath(mainCell, start.x, start.y, end.x, end.y);
        }
    }
    
    buildRoadPath(mainCell, startX, startY, endX, endY) {
        // Simple Manhattan distance pathfinding
        let currentX = startX;
        let currentY = startY;
        
        while (currentX !== endX || currentY !== endY) {
            const cell = mainCell.innerGrid[currentX][currentY];
            if (cell.terrain === 'land' && !cell.road && cell.development === 'none') {
                cell.road = true;
            }
            
            // Move towards target
            if (currentX < endX) currentX++;
            else if (currentX > endX) currentX--;
            else if (currentY < endY) currentY++;
            else if (currentY > endY) currentY--;
        }
    }
    
    initiateBattle(attackingArmy, targetX, targetY) {
        const targetCell = this.map[targetX][targetY];
        const defendingNation = this.nations[targetCell.owner];
        const attackingNation = this.nations[attackingArmy.nationId];
        
        // Find defending armies in the target cell
        const defendingArmies = [];
        for (let i = 0; i < this.INNER_SIZE; i++) {
            for (let j = 0; j < this.INNER_SIZE; j++) {
                const innerCell = targetCell.innerGrid[i][j];
                if (innerCell.army && innerCell.army.nationId === targetCell.owner) {
                    defendingArmies.push(innerCell.army);
                }
            }
        }
        
        // Calculate battle outcome
        const attackPower = attackingArmy.level + Math.floor(this.random() * 6) + 1;
        const defensePower = defendingArmies.reduce((total, army) => total + army.level, 0) + 
                           Math.floor(this.random() * 6) + 1 + 
                           (targetCell.development === 'castle' ? 3 : 0);
        
        const battle = {
            turn: this.turn,
            attacker: attackingNation.name,
            defender: defendingNation.name,
            location: { x: targetX, y: targetY },
            attackPower: attackPower,
            defensePower: defensePower,
            winner: null
        };
        
        if (attackPower > defensePower) {
            // Attacker wins
            battle.winner = attackingNation.name;
            
            // Remove defending armies
            for (let army of defendingArmies) {
                this.removeArmy(army);
            }
            
            // Transfer territory
            targetCell.owner = attackingArmy.nationId;
            defendingNation.territory = defendingNation.territory.filter(t => 
                !(t.x === targetX && t.y === targetY)
            );
            attackingNation.territory.push({ x: targetX, y: targetY });
            
            // Move attacking army to conquered territory
            this.moveArmy(attackingArmy, targetX, targetY);
            
            this.log(`${attackingNation.name} conquered (${targetX}, ${targetY}) from ${defendingNation.name} (${attackPower} vs ${defensePower})`);
        } else {
            // Defender wins
            battle.winner = defendingNation.name;
            
            // Attacking army takes damage or is destroyed
            if (this.random() < 0.5) {
                this.removeArmy(attackingArmy);
                this.log(`${defendingNation.name} destroyed ${attackingNation.name} army at (${targetX}, ${targetY}) (${defensePower} vs ${attackPower})`);
            } else {
                attackingArmy.health -= 25;
                this.log(`${defendingNation.name} repelled ${attackingNation.name} attack at (${targetX}, ${targetY}) (${defensePower} vs ${attackPower})`);
            }
        }
        
        // Record battle
        attackingNation.battles.push(battle);
        defendingNation.battles.push(battle);
    }
    
    removeArmy(army) {
        const nation = this.nations[army.nationId];
        nation.armies = nation.armies.filter(a => a !== army);
        
        // Remove from map
        if (army.innerX !== null && army.innerY !== null) {
            this.map[army.x][army.y].innerGrid[army.innerX][army.innerY].army = null;
        }
    }
    
    processBattles() {
        // Battles are now handled in real-time during army movement
        // This function can be used for cleanup or periodic battle resolution
        for (let nation of this.nations) {
            for (let army of nation.armies) {
                if (army.health <= 0) {
                    this.removeArmy(army);
                }
            }
        }
    }
    
    resolveBattle(army, defenderId) {
        const attacker = this.nations[army.nationId];
        const defender = this.nations[defenderId];
        
        const attackRoll = Math.floor(this.random() * 6) + army.level;
        const defenseRoll = Math.floor(this.random() * 6) + 3;
        
        if (attackRoll > defenseRoll) {
            this.map[army.x][army.y].owner = army.nationId;
            attacker.territory.push({ x: army.x, y: army.y });
            defender.territory = defender.territory.filter(t => 
                !(t.x === army.x && t.y === army.y)
            );
            this.log(`${attacker.name} conquered (${army.x}, ${army.y}) from ${defender.name}`);
        } else {
            this.log(`${defender.name} successfully defended (${army.x}, ${army.y})`);
        }
    }
    
    updateNationStats(nation) {
        nation.totalTerritory = nation.territory.length;
        nation.totalArmies = nation.armies.length;
        nation.totalPopulation = nation.territory.reduce((sum, t) => 
            sum + this.map[t.x][t.y].population, 0
        );
    }
    
    render() {
        this.renderMap();
        this.renderStats();
        this.renderBattleStats();
        this.renderLog();
        this.renderLegend();
    }
    
    renderMap() {
        const mapDisplay = document.getElementById('mapDisplay');
        mapDisplay.innerHTML = '';
        
        if (this.zoomedSquare) {
            this.renderInnerGrid();
        } else {
            this.renderMainGrid();
        }
    }
    
    renderMainGrid() {
        const mapDisplay = document.getElementById('mapDisplay');
        
        for (let i = 0; i < this.MAP_SIZE; i++) {
            for (let j = 0; j < this.MAP_SIZE; j++) {
                const cell = this.map[i][j];
                const cellDiv = document.createElement('div');
                cellDiv.className = 'map-cell';
                cellDiv.onclick = () => this.zoomIntoSquare(i, j);
                cellDiv.setAttribute('data-x', i);
                cellDiv.setAttribute('data-y', j);
                
                // Add highlight if this is the highlighted square
                if (this.highlightedSquare && 
                    this.highlightedSquare.type === 'main' && 
                    this.highlightedSquare.x === i && 
                    this.highlightedSquare.y === j) {
                    cellDiv.classList.add('highlighted');
                }
                
                let char = this.getMainCellDisplay(cell);
                let backgroundColor = this.getMainCellColor(cell);
                
                cellDiv.textContent = char;
                cellDiv.style.backgroundColor = backgroundColor;
                cellDiv.title = `(${i},${j}) ${cell.terrain} - Owner: ${cell.owner ? this.nations[cell.owner].name : 'None'} - Click to zoom`;
                
                mapDisplay.appendChild(cellDiv);
            }
        }
    }
    
    renderInnerGrid() {
        const mapDisplay = document.getElementById('mapDisplay');
        const mainCell = this.map[this.zoomedSquare.x][this.zoomedSquare.y];
        
        for (let i = 0; i < this.INNER_SIZE; i++) {
            for (let j = 0; j < this.INNER_SIZE; j++) {
                const innerCell = mainCell.innerGrid[i][j];
                const cellDiv = document.createElement('div');
                cellDiv.className = 'inner-cell';
                cellDiv.setAttribute('data-x', i);
                cellDiv.setAttribute('data-y', j);
                
                // Add highlight if this is the highlighted inner cell
                if (this.highlightedSquare && 
                    this.highlightedSquare.type === 'inner' && 
                    this.highlightedSquare.x === i && 
                    this.highlightedSquare.y === j &&
                    this.highlightedSquare.mainX === this.zoomedSquare.x &&
                    this.highlightedSquare.mainY === this.zoomedSquare.y) {
                    cellDiv.classList.add('highlighted');
                }
                
                let char = this.getInnerCellDisplay(innerCell);
                let backgroundColor = this.getInnerCellColor(innerCell, mainCell);
                
                cellDiv.textContent = char;
                cellDiv.style.backgroundColor = backgroundColor;
                cellDiv.title = `Inner (${i},${j}) ${innerCell.terrain} - ${innerCell.development} - Pop: ${innerCell.population}`;
                
                mapDisplay.appendChild(cellDiv);
            }
        }
    }
    
    getMainCellDisplay(cell) {
        // Show the most significant feature of the cell
        if (cell.owner !== null) {
            // Check for major developments in inner grid
            const majorDevelopment = this.getMajorDevelopment(cell);
            if (majorDevelopment) {
                return majorDevelopment;
            }
            return this.nations[cell.owner].symbol;
        } else if (cell.terrain === 'ocean') {
            return '~';
        } else if (cell.terrain === 'mountain') {
            return '^';
        } else if (cell.terrain === 'river') {
            return '≈';
        }
        return '·';
    }
    
    getMajorDevelopment(cell) {
        // Check inner grid for major developments
        let hasCastle = false;
        let hasCity = false;
        let townCount = 0;
        let armyCount = 0;
        
        for (let i = 0; i < this.INNER_SIZE; i++) {
            for (let j = 0; j < this.INNER_SIZE; j++) {
                const innerCell = cell.innerGrid[i][j];
                if (innerCell.development === 'castle') hasCastle = true;
                if (innerCell.development === 'city') hasCity = true;
                if (innerCell.development === 'town') townCount++;
                if (innerCell.army) armyCount++;
            }
        }
        
        if (hasCastle) return '🏰';
        if (hasCity) return '🏛';
        if (townCount >= 3) return '🏘'; // Multiple towns
        if (armyCount >= 2) return '⚔'; // Multiple armies
        
        return null;
    }
    
    getMainCellColor(cell) {
        if (cell.owner !== null) {
            return this.getNationColor(cell.owner);
        } else if (cell.terrain === 'ocean') {
            return '#000044';
        } else if (cell.terrain === 'mountain') {
            return '#444400';
        } else if (cell.terrain === 'river') {
            return '#004444';
        }
        return '#002200';
    }
    
    getInnerCellDisplay(innerCell) {
        if (innerCell.army) {
            return '⚔';
        } else if (innerCell.development === 'city') {
            return '🏛';
        } else if (innerCell.development === 'town') {
            return '🏠';
        } else if (innerCell.development === 'castle') {
            return '🏰';
        } else if (innerCell.development === 'farm') {
            return '🌾';
        } else if (innerCell.development === 'mine') {
            return '⛏';
        } else if (innerCell.development === 'forest') {
            return '🌲';
        } else if (innerCell.road) {
            return '━';
        } else if (innerCell.terrain === 'ocean') {
            return '~';
        } else if (innerCell.terrain === 'mountain') {
            return '^';
        } else if (innerCell.terrain === 'river') {
            return '≈';
        }
        return '·';
    }
    
    getInnerCellColor(innerCell, mainCell) {
        if (innerCell.army) {
            return '#660000';
        } else if (innerCell.development !== 'none') {
            return '#004400';
        } else if (innerCell.terrain === 'ocean') {
            return '#000044';
        } else if (innerCell.terrain === 'mountain') {
            return '#444400';
        } else if (innerCell.terrain === 'river') {
            return '#004444';
        }
        
        // Base color from main cell owner
        if (mainCell.owner !== null) {
            return this.getNationColor(mainCell.owner);
        }
        return '#002200';
    }
    
    zoomIntoSquare(x, y) {
        this.zoomedSquare = { x, y };
        document.getElementById('zoomOutBtn').style.display = 'inline-block';
        document.getElementById('zoomInfo').style.display = 'block';
        
        // Show development info for this square
        const cell = this.map[x][y];
        let devCount = 0;
        let devTypes = {};
        
        for (let i = 0; i < this.INNER_SIZE; i++) {
            for (let j = 0; j < this.INNER_SIZE; j++) {
                const innerCell = cell.innerGrid[i][j];
                if (innerCell.development !== 'none') {
                    devCount++;
                    devTypes[innerCell.development] = (devTypes[innerCell.development] || 0) + 1;
                }
            }
        }
        
        const devInfo = Object.entries(devTypes).map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`).join(', ');
        document.getElementById('zoomCoords').textContent = `(${x}, ${y}) - ${devCount} developments: ${devInfo || 'none'}`;
        this.render();
    }
    
    zoomOut() {
        this.zoomedSquare = null;
        this.highlightedSquare = null; // Clear highlight when zooming out
        document.getElementById('zoomOutBtn').style.display = 'none';
        document.getElementById('zoomInfo').style.display = 'none';
        this.render();
    }
    
    highlightMainSquare(x, y) {
        this.highlightedSquare = { x: parseInt(x), y: parseInt(y), type: 'main' };
        
        // If currently zoomed in, zoom out to main view
        if (this.zoomedSquare) {
            this.zoomOut();
        } else {
            this.render();
        }
        
        // Auto-clear highlight after 3 seconds
        setTimeout(() => {
            if (this.highlightedSquare && 
                this.highlightedSquare.type === 'main' && 
                this.highlightedSquare.x === parseInt(x) && 
                this.highlightedSquare.y === parseInt(y)) {
                this.highlightedSquare = null;
                this.render();
            }
        }, 3000);
    }
    
    highlightInnerSquare(innerX, innerY, mainX, mainY) {
        this.highlightedSquare = { 
            x: parseInt(innerX), 
            y: parseInt(innerY), 
            mainX: parseInt(mainX), 
            mainY: parseInt(mainY), 
            type: 'inner' 
        };
        
        // Zoom into the main square if not already there
        if (!this.zoomedSquare || 
            this.zoomedSquare.x !== parseInt(mainX) || 
            this.zoomedSquare.y !== parseInt(mainY)) {
            this.zoomIntoSquare(parseInt(mainX), parseInt(mainY));
        } else {
            this.render();
        }
        
        // Auto-clear highlight after 3 seconds
        setTimeout(() => {
            if (this.highlightedSquare && 
                this.highlightedSquare.type === 'inner' && 
                this.highlightedSquare.x === parseInt(innerX) && 
                this.highlightedSquare.y === parseInt(innerY) &&
                this.highlightedSquare.mainX === parseInt(mainX) &&
                this.highlightedSquare.mainY === parseInt(mainY)) {
                this.highlightedSquare = null;
                this.render();
            }
        }, 3000);
    }
    

    
    getNationColor(nationId) {
        const colors = ['#440000', '#000044', '#004400', '#444400'];
        return colors[nationId] || '#002200';
    }
    
    renderStats() {
        const statsDisplay = document.getElementById('stats');
        
        let html = `<h3>Turn: ${this.turn}</h3>`;
        html += '<table>';
        html += '<thead><tr>';
        html += '<th>Nation</th>';
        html += '<th>Territory</th>';
        html += '<th>Armies</th>';
        html += '<th>Gold</th>';
        html += '<th>Wood</th>';
        html += '<th>Food</th>';
        html += '<th>Metal</th>';
        html += '</tr></thead>';
        html += '<tbody>';
        
        for (let nation of this.nations) {
            html += '<tr>';
            html += `<td>${nation.name}</td>`;
            html += `<td>${nation.totalTerritory}</td>`;
            html += `<td>${nation.totalArmies}</td>`;
            html += `<td>${nation.resources.gold}</td>`;
            html += `<td>${nation.resources.wood}</td>`;
            html += `<td>${nation.resources.food}</td>`;
            html += `<td>${nation.resources.metal}</td>`;
            html += '</tr>';
        }
        
        html += '</tbody></table>';
        statsDisplay.innerHTML = html;
    }
    
    renderLog() {
        const logDisplay = document.getElementById('gameLog');
        const recentLogs = this.gameLog.slice(-30);
        
        let html = '';
        for (let log of recentLogs) {
            if (log.includes('--- Turn')) {
                html += `<div class="log-turn">${log}</div>`;
            } else {
                const processedLog = this.processLogForCoordinates(log);
                html += `<div class="log-entry">${processedLog}</div>`;
            }
        }
        
        logDisplay.innerHTML = html;
        logDisplay.scrollTop = logDisplay.scrollHeight;
    }
    
    processLogForCoordinates(logMessage) {
        // Pattern for main coordinates: (x, y)
        let processed = logMessage.replace(/\((\d+),\s*(\d+)\)/g, (match, x, y) => {
            return `<span class="coordinate-link" onclick="game.highlightMainSquare(${x}, ${y})">(${x}, ${y})</span>`;
        });
        
        // Pattern for inner coordinates: inner (x, y) in square (mainX, mainY)
        processed = processed.replace(/inner \((\d+),\s*(\d+)\) in square \((\d+),\s*(\d+)\)/g, 
            (match, innerX, innerY, mainX, mainY) => {
                return `inner <span class="coordinate-link" onclick="game.highlightInnerSquare(${innerX}, ${innerY}, ${mainX}, ${mainY})">(${innerX}, ${innerY})</span> in square <span class="coordinate-link" onclick="game.highlightMainSquare(${mainX}, ${mainY})">(${mainX}, ${mainY})</span>`;
            });
        
        return processed;
    }
    
    log(message) {
        this.gameLog.push(`T${this.turn}: ${message}`);
    }
    
    renderBattleStats() {
        const battleList = document.getElementById('battleList');
        
        // Collect all battles from all nations
        const allBattles = [];
        for (let nation of this.nations) {
            allBattles.push(...nation.battles);
        }
        
        // Sort by turn (most recent first) and remove duplicates
        const uniqueBattles = [];
        const seenBattles = new Set();
        
        for (let battle of allBattles) {
            const battleKey = `${battle.turn}-${battle.location.x}-${battle.location.y}-${battle.attacker}-${battle.defender}`;
            if (!seenBattles.has(battleKey)) {
                seenBattles.add(battleKey);
                uniqueBattles.push(battle);
            }
        }
        
        uniqueBattles.sort((a, b) => b.turn - a.turn);
        const recentBattles = uniqueBattles.slice(0, 10);
        
        let html = '';
        for (let battle of recentBattles) {
            const locationLink = `<span class="coordinate-link" onclick="game.highlightMainSquare(${battle.location.x}, ${battle.location.y})">(${battle.location.x}, ${battle.location.y})</span>`;
            html += `<div>T${battle.turn}: ${battle.winner} won at ${locationLink} (${battle.attacker} ${battle.attackPower} vs ${battle.defender} ${battle.defensePower})</div>`;
        }
        
        if (html === '') {
            html = '<div>No battles yet</div>';
        }
        
        battleList.innerHTML = html;
    }
    
    renderLegend() {
        const legendGrid = document.getElementById('legendGrid');
        legendGrid.innerHTML = '';
        
        const legendItems = [];
        
        // Add nations
        for (let nation of this.nations) {
            legendItems.push({
                symbol: nation.symbol,
                label: nation.name,
                backgroundColor: this.getNationColor(nation.id)
            });
        }
        
        // Add terrain types
        legendItems.push({
            symbol: '~',
            label: 'Ocean',
            backgroundColor: '#000044'
        });
        
        legendItems.push({
            symbol: '^',
            label: 'Mountain',
            backgroundColor: '#444400'
        });
        
        legendItems.push({
            symbol: '≈',
            label: 'River',
            backgroundColor: '#004444'
        });
        
        legendItems.push({
            symbol: '·',
            label: 'Neutral Land',
            backgroundColor: '#002200'
        });
        
        // Add major developments (main grid)
        if (!this.zoomedSquare) {
            legendItems.push({
                symbol: '🏰',
                label: 'Castle',
                backgroundColor: '#004400'
            });
            
            legendItems.push({
                symbol: '🏛',
                label: 'City',
                backgroundColor: '#004400'
            });
            
            legendItems.push({
                symbol: '🏘',
                label: 'Multiple Towns',
                backgroundColor: '#004400'
            });
            
            legendItems.push({
                symbol: '⚔',
                label: 'Multiple Armies',
                backgroundColor: '#660000'
            });
        } else {
            // Add inner grid developments when zoomed
            legendItems.push({
                symbol: '🏰',
                label: 'Castle',
                backgroundColor: '#004400'
            });
            
            legendItems.push({
                symbol: '🏛',
                label: 'City',
                backgroundColor: '#004400'
            });
            
            legendItems.push({
                symbol: '🏠',
                label: 'Town',
                backgroundColor: '#004400'
            });
            
            legendItems.push({
                symbol: '🌾',
                label: 'Farm',
                backgroundColor: '#004400'
            });
            
            legendItems.push({
                symbol: '⛏',
                label: 'Mine',
                backgroundColor: '#004400'
            });
            
            legendItems.push({
                symbol: '🌲',
                label: 'Forest',
                backgroundColor: '#004400'
            });
            
            legendItems.push({
                symbol: '⚔',
                label: 'Army',
                backgroundColor: '#660000'
            });
            
            legendItems.push({
                symbol: '━',
                label: 'Road',
                backgroundColor: '#333333'
            });
        }
        
        // Create legend items
        for (let item of legendItems) {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            
            const symbolSpan = document.createElement('span');
            symbolSpan.className = 'legend-symbol';
            symbolSpan.style.backgroundColor = item.backgroundColor;
            symbolSpan.textContent = item.symbol;
            
            const labelSpan = document.createElement('span');
            labelSpan.textContent = item.label;
            
            legendItem.appendChild(symbolSpan);
            legendItem.appendChild(labelSpan);
            legendGrid.appendChild(legendItem);
        }
    }
    
    autoPlay() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.autoPlayInterval = setInterval(() => {
            this.nextTurn();
        }, 1000);
    }
    
    pause() {
        this.isPlaying = false;
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
    
    reset() {
        this.pause();
        this.turn = 0;
        this.nations = [];
        this.map = this.initializeMap();
        this.gameLog = [];
        
        // Generate new seed for reset
        this.seed = Math.floor(Math.random() * 1000000);
        this.random = this.createSeededRandom(this.seed);
        
        this.initializeGame();
        this.render();
    }
}

class Nation {
    constructor(id, name, symbol) {
        this.id = id;
        this.name = name;
        this.symbol = symbol;
        this.resources = {
            gold: 100,
            wood: 50,
            food: 50,
            metal: 30
        };
        this.territory = [];
        this.armies = [];
        this.capital = null;
        this.totalTerritory = 0;
        this.totalArmies = 0;
        this.totalPopulation = 0;
        this.diplomacy = {}; // relations with other nations: 'neutral', 'war', 'peace', 'trade'
        this.tradeOffers = []; // pending trade offers
        this.battles = []; // battle history
    }
}

class Army {
    constructor(nationId, x, y, innerX = null, innerY = null) {
        this.nationId = nationId;
        this.x = x; // main grid position
        this.y = y;
        this.innerX = innerX; // inner grid position
        this.innerY = innerY;
        this.level = 1;
        this.health = 100;
        this.experience = 0;
        this.movementPoints = 3; // movement per turn
        this.orders = null; // current orders: move, attack, defend, build
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    game = new Game();
    // Display seed after DOM is ready
    setTimeout(() => game.displaySeed(), 100);
});
