class Game {
    constructor() {
        this.MAP_SIZE = 10;
        this.INNER_SIZE = 10;
        this.turn = 0;
        this.nations = [];
        this.map = this.initializeMap();
        this.gameLog = [];
        this.isPlaying = false;
        this.autoPlayInterval = null;
        this.zoomedSquare = null; // {x, y} when zoomed into a square
        
        this.initializeGame();
        this.render();
    }
    
    initializeMap() {
        const map = [];
        for (let i = 0; i < this.MAP_SIZE; i++) {
            map[i] = [];
            for (let j = 0; j < this.MAP_SIZE; j++) {
                map[i][j] = {
                    owner: null,
                    terrain: 'land',
                    resources: {
                        gold: 0,
                        wood: 0,
                        food: 0,
                        metal: 0
                    },
                    development: 'none', // none, farm, mine, forest, town, city
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
                inner[i][j] = {
                    terrain: Math.random() < 0.1 ? 'mountain' : 
                            Math.random() < 0.15 ? 'river' : 
                            Math.random() < 0.05 ? 'ocean' : 'land',
                    resources: Math.random() < 0.2 ? this.getRandomResource() : null,
                    development: 'none', // none, farm, mine, forest, town, city, castle
                    army: null,
                    population: 0
                };
            }
        }
        return inner;
    }
    
    getRandomResource() {
        const resources = ['gold', 'wood', 'food', 'metal'];
        return resources[Math.floor(Math.random() * resources.length)];
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
        
        this.log(`Game initialized with ${nationCount} nations`);
    }
    
    placeNationsOnMap() {
        const minDistance = 3;
        const positions = [];
        
        for (let nation of this.nations) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const x = Math.floor(Math.random() * this.MAP_SIZE);
                const y = Math.floor(Math.random() * this.MAP_SIZE);
                
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
                    this.map[x][y].development = 'city';
                    this.map[x][y].population = 1000;
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
            const startX = Math.floor(Math.random() * this.MAP_SIZE);
            const startY = Math.floor(Math.random() * this.MAP_SIZE);
            this.generateOcean(startX, startY);
        }
        
        // Generate rivers
        for (let i = 0; i < 2; i++) {
            this.generateRiver();
        }
        
        // Generate mountains
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * this.MAP_SIZE);
            const y = Math.floor(Math.random() * this.MAP_SIZE);
            if (!this.map[x][y].owner) {
                this.map[x][y].terrain = 'mountain';
            }
        }
    }
    
    generateOcean(startX, startY) {
        const size = Math.floor(Math.random() * 3) + 1;
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
        const startX = Math.floor(Math.random() * this.MAP_SIZE);
        const startY = 0;
        let x = startX;
        let y = startY;
        
        while (y < this.MAP_SIZE - 1) {
            if (!this.map[x][y].owner) {
                this.map[x][y].terrain = 'river';
                this.map[x][y].resources.food += 2;
            }
            
            y++;
            if (Math.random() < 0.3) {
                x += Math.random() < 0.5 ? -1 : 1;
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
                    cell.resources.wood = Math.floor(Math.random() * 5) + 1;
                    cell.resources.food = Math.floor(Math.random() * 3) + 1;
                }
                
                if (cell.terrain === 'mountain') {
                    cell.resources.metal = Math.floor(Math.random() * 8) + 2;
                }
                
                if (cell.terrain === 'river') {
                    cell.resources.food = Math.floor(Math.random() * 6) + 3;
                }
                
                // Random gold deposits
                if (Math.random() < 0.15) {
                    cell.resources.gold = Math.floor(Math.random() * 3) + 1;
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
            
            // Base collection
            collected.gold += cell.resources.gold;
            collected.wood += cell.resources.wood;
            collected.food += cell.resources.food;
            collected.metal += cell.resources.metal;
            
            // Development bonuses
            if (cell.development === 'farm') {
                collected.food += 3;
            } else if (cell.development === 'mine') {
                collected.metal += 2;
            } else if (cell.development === 'forest') {
                collected.wood += 2;
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
        // Simple AI decisions
        if (nation.resources.gold > 50 && Math.random() < 0.3) {
            this.createArmy(nation);
        }
        
        if (nation.resources.gold > 30 && Math.random() < 0.2) {
            this.developLand(nation);
        }
        
        if (Math.random() < 0.4) {
            this.expandTerritory(nation);
        }
    }
    
    createArmy(nation) {
        if (nation.territory.length === 0) return;
        
        const spawnPoint = nation.territory[Math.floor(Math.random() * nation.territory.length)];
        const cost = 15;
        
        if (nation.resources.gold >= cost) {
            const army = new Army(nation.id, spawnPoint.x, spawnPoint.y);
            nation.armies.push(army);
            nation.resources.gold -= cost;
            this.log(`${nation.name} created army at (${spawnPoint.x}, ${spawnPoint.y})`);
        }
    }
    
    developLand(nation) {
        const undeveloped = nation.territory.filter(t => 
            this.map[t.x][t.y].development === 'none'
        );
        
        if (undeveloped.length === 0) return;
        
        const target = undeveloped[Math.floor(Math.random() * undeveloped.length)];
        const cell = this.map[target.x][target.y];
        
        const developments = ['farm', 'mine', 'forest'];
        cell.development = developments[Math.floor(Math.random() * developments.length)];
        nation.resources.gold -= 20;
        
        this.log(`${nation.name} developed ${cell.development} at (${target.x}, ${target.y})`);
    }
    
    expandTerritory(nation) {
        const borders = this.getBorderTerritories(nation);
        
        if (borders.length === 0) return;
        
        const target = borders[Math.floor(Math.random() * borders.length)];
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
    
    processBattles() {
        // Simple battle resolution
        for (let nation of this.nations) {
            for (let army of nation.armies) {
                const cell = this.map[army.x][army.y];
                if (cell.owner !== nation.id && cell.owner !== null) {
                    this.resolveBattle(army, cell.owner);
                }
            }
        }
    }
    
    resolveBattle(army, defenderId) {
        const attacker = this.nations[army.nationId];
        const defender = this.nations[defenderId];
        
        const attackRoll = Math.floor(Math.random() * 6) + army.level;
        const defenseRoll = Math.floor(Math.random() * 6) + 3;
        
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
        this.renderLog();
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
                cellDiv.onclick = () => this.handleInnerCellClick(i, j);
                
                let char = this.getInnerCellDisplay(innerCell);
                let backgroundColor = this.getInnerCellColor(innerCell, mainCell);
                
                cellDiv.textContent = char;
                cellDiv.style.backgroundColor = backgroundColor;
                cellDiv.title = `Inner (${i},${j}) ${innerCell.terrain} - ${innerCell.development}`;
                
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
        document.getElementById('zoomCoords').textContent = `(${x}, ${y})`;
        this.render();
    }
    
    zoomOut() {
        this.zoomedSquare = null;
        document.getElementById('zoomOutBtn').style.display = 'none';
        document.getElementById('zoomInfo').style.display = 'none';
        this.render();
    }
    
    handleInnerCellClick(x, y) {
        if (!this.zoomedSquare) return;
        
        const mainCell = this.map[this.zoomedSquare.x][this.zoomedSquare.y];
        const innerCell = mainCell.innerGrid[x][y];
        
        // Simple development logic
        if (innerCell.terrain === 'land' && innerCell.development === 'none') {
            if (Math.random() < 0.33) {
                innerCell.development = 'farm';
            } else if (Math.random() < 0.5) {
                innerCell.development = 'forest';
            } else {
                innerCell.development = 'town';
                innerCell.population = 100;
            }
            this.log(`Developed ${innerCell.development} at inner (${x}, ${y}) in square (${this.zoomedSquare.x}, ${this.zoomedSquare.y})`);
            this.render();
        }
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
                html += `<div class="log-entry">${log}</div>`;
            }
        }
        
        logDisplay.innerHTML = html;
        logDisplay.scrollTop = logDisplay.scrollHeight;
    }
    
    log(message) {
        this.gameLog.push(`T${this.turn}: ${message}`);
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
    }
}

class Army {
    constructor(nationId, x, y) {
        this.nationId = nationId;
        this.x = x;
        this.y = y;
        this.level = 1;
        this.health = 100;
        this.experience = 0;
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    game = new Game();
});
