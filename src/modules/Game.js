/**
 * Main Game class - orchestrates all game systems
 */

import { GAME_CONFIG, NATION_CONFIG } from '../utils/Constants.js';
import { SeededRandom, getSeedFromURL, updateURLWithSeed } from '../utils/RandomUtils.js';
import { MapGenerator } from './MapGenerator.js';
import { Nation } from './Nation.js';
import { Army } from './Army.js';
import { ResourceManager } from './ResourceManager.js';
import { BattleManager } from './BattleManager.js';
import { AIManager } from './AIManager.js';

export class Game {
    constructor(seed = null) {
        // Initialize random generator with seed
        this.seed = seed || getSeedFromURL() || Math.floor(Math.random() * 1000000);
        this.random = new SeededRandom(this.seed);
        updateURLWithSeed(this.seed);
        
        // Game state
        this.turn = 0;
        this.isPlaying = false;
        this.autoPlayInterval = null;
        this.gameSpeed = 1000; // ms between turns
        
        // Game objects
        this.nations = [];
        this.map = null;
        this.gameLog = [];
        
        // Managers
        this.mapGenerator = new MapGenerator(this.random);
        this.resourceManager = new ResourceManager();
        this.battleManager = new BattleManager(this.random);
        this.aiManager = new AIManager(this.random);
        
        // UI state
        this.zoomedSquare = null;
        this.highlightedSquare = null;
        this.lastRenderState = null;
        
        // Performance tracking
        this.performanceStats = {
            turnTime: 0,
            renderTime: 0,
            lastUpdate: Date.now()
        };
        
        // Initialize game
        this.initializeGame();
    }

    /**
     * Initialize the game state
     */
    initializeGame() {
        console.log(`Initializing game with seed: ${this.seed}`);
        
        try {
            // Generate map
            this.map = this.mapGenerator.generateMap();
            
            // Create nations
            this.createNations();
            
            // Place nations on map
            this.placeNationsOnMap();
            
            // Initialize managers with game state
            this.resourceManager.initialize(this.map, this.nations);
            this.aiManager.initialize(this.nations, this.map);
            
            this.log(`Game initialized with ${this.nations.length} nations (seed: ${this.seed})`);
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.log(`Error: Game initialization failed - ${error.message}`);
        }
    }

    /**
     * Create nations
     */
    createNations() {
        this.nations = [];
        
        for (let i = 0; i < GAME_CONFIG.NATION_COUNT; i++) {
            const nation = new Nation(i);
            this.nations.push(nation);
        }
    }

    /**
     * Place nations on the map with minimum distance
     */
    placeNationsOnMap() {
        const positions = [];
        const minDistance = GAME_CONFIG.MIN_NATION_DISTANCE;
        
        for (const nation of this.nations) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const x = this.random.randomInt(0, GAME_CONFIG.MAP_SIZE - 1);
                const y = this.random.randomInt(0, GAME_CONFIG.MAP_SIZE - 1);
                
                // Check if position is valid (land terrain)
                if (this.map[x][y].terrain !== 'land') {
                    attempts++;
                    continue;
                }
                
                // Check minimum distance from other nations
                let validPosition = true;
                for (const pos of positions) {
                    const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
                    if (distance < minDistance) {
                        validPosition = false;
                        break;
                    }
                }
                
                if (validPosition) {
                    // Place nation capital
                    this.map[x][y].owner = nation.id;
                    this.map[x][y].development = 'city';
                    this.map[x][y].population = 1000;
                    
                    // Place city in center of inner grid
                    const centerX = Math.floor(GAME_CONFIG.INNER_SIZE / 2);
                    const centerY = Math.floor(GAME_CONFIG.INNER_SIZE / 2);
                    this.map[x][y].innerGrid[centerX][centerY].development = 'city';
                    this.map[x][y].innerGrid[centerX][centerY].population = 1000;
                    this.map[x][y].innerGrid[centerX][centerY].level = 3;
                    
                    // Set nation properties
                    nation.capital = { x, y };
                    nation.addTerritory(x, y);
                    
                    positions.push({ x, y });
                    placed = true;
                    
                    this.log(`${nation.name} established capital at (${x}, ${y})`);
                }
                attempts++;
            }
            
            if (!placed) {
                console.warn(`Failed to place nation ${nation.name} after ${attempts} attempts`);
            }
        }
    }

    /**
     * Advance game by one turn
     */
    nextTurn() {
        const startTime = Date.now();
        
        try {
            this.turn++;
            console.log(`Processing turn ${this.turn}...`);
            this.log(`--- Turn ${this.turn} ---`);
            
            // Process each nation
            for (const nation of this.nations) {
                if (!nation.isEliminated()) {
                    console.log(`Processing ${nation.name}...`);
                    this.processNationTurn(nation);
                }
            }
            
            // Process global effects
            this.processGlobalEffects();
            
            // Clean up eliminated nations
            this.cleanupEliminatedNations();
            
            // Update performance stats
            this.performanceStats.turnTime = Date.now() - startTime;
            this.performanceStats.lastUpdate = Date.now();
            
            console.log(`Turn ${this.turn} completed. Log entries: ${this.gameLog.length}`);
            
        } catch (error) {
            console.error('Error processing turn:', error);
            this.log(`Error: Turn processing failed - ${error.message}`);
        }
    }

    /**
     * Process a single nation's turn
     */
    processNationTurn(nation) {
        try {
            // Collect resources
            this.resourceManager.collectResources(nation, this.map);
            
            // Pay upkeep
            this.resourceManager.payUpkeep(nation);
            
            // Clean up expired trade offers
            nation.cleanupExpiredTradeOffers(this.turn);
            
            // AI decision making
            this.aiManager.makeDecisions(nation, this.map, this.turn);
            
            // Update nation statistics
            nation.updateStatistics(this.map);
            
        } catch (error) {
            console.error(`Error processing turn for ${nation.name}:`, error);
            this.log(`Error: ${nation.name} turn processing failed - ${error.message}`);
        }
    }

    /**
     * Process global game effects
     */
    processGlobalEffects() {
        // Process population growth
        this.processPopulationGrowth();
        
        // Check for game end conditions
        this.checkGameEndConditions();
    }

    /**
     * Process population growth for all settlements
     */
    processPopulationGrowth() {
        for (let x = 0; x < GAME_CONFIG.MAP_SIZE; x++) {
            for (let y = 0; y < GAME_CONFIG.MAP_SIZE; y++) {
                const cell = this.map[x][y];
                
                if (cell.owner !== null) {
                    const nation = this.nations[cell.owner];
                    
                    // Main cell population growth
                    if (cell.development === 'town' || cell.development === 'city') {
                        this.growPopulation(cell, nation);
                    }
                    
                    // Inner grid population growth
                    for (let i = 0; i < GAME_CONFIG.INNER_SIZE; i++) {
                        for (let j = 0; j < GAME_CONFIG.INNER_SIZE; j++) {
                            const innerCell = cell.innerGrid[i][j];
                            if (innerCell.development === 'town' || innerCell.development === 'city') {
                                this.growPopulation(innerCell, nation);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Grow population for a settlement
     */
    growPopulation(cell, nation) {
        if (nation.resources.food > 10) {
            const growthRate = cell.development === 'city' ? 0.05 : 0.03;
            const growth = Math.floor(cell.population * growthRate);
            
            if (growth > 0) {
                cell.population += growth;
                nation.addResources({ food: -growth });
                
                // Level up settlements based on population
                if (cell.development === 'town' && cell.population >= 500 && cell.level < 3) {
                    cell.level++;
                } else if (cell.development === 'city' && cell.population >= 2000 && cell.level < 5) {
                    cell.level++;
                }
            }
        }
    }

    /**
     * Clean up eliminated nations
     */
    cleanupEliminatedNations() {
        const eliminatedNations = this.nations.filter(nation => nation.isEliminated());
        
        for (const nation of eliminatedNations) {
            this.log(`${nation.name} has been eliminated!`);
            
            // Remove armies
            for (const army of nation.armies) {
                this.removeArmyFromMap(army);
            }
            nation.armies = [];
            
            // Convert territory to neutral
            for (const territory of nation.territory) {
                const cell = this.map[territory.x][territory.y];
                cell.owner = null;
            }
            nation.territory = [];
        }
    }

    /**
     * Check for game end conditions
     */
    checkGameEndConditions() {
        const activeNations = this.nations.filter(nation => !nation.isEliminated());
        
        if (activeNations.length <= 1) {
            this.pause();
            
            if (activeNations.length === 1) {
                const winner = activeNations[0];
                this.log(`🎉 ${winner.name} has achieved total victory! 🎉`);
            } else {
                this.log('💀 All nations have been eliminated! The world lies in ruins. 💀');
            }
        }
    }

    /**
     * Create an army for a nation
     */
    createArmy(nation, x, y, innerX, innerY, level = 1) {
        try {
            const cost = Army.getCreationCost(level);
            
            if (!nation.canAfford(cost)) {
                return null;
            }
            
            const army = new Army(nation.id, x, y, innerX, innerY);
            army.setLevel(level);
            army.createdTurn = this.turn;
            
            nation.spendResources(cost);
            nation.addArmy(army);
            
            // Place army on map
            if (innerX !== null && innerY !== null) {
                this.map[x][y].innerGrid[innerX][innerY].army = army;
            }
            
            this.log(`${nation.name} created level ${level} army at (${x}, ${y})`);
            return army;
            
        } catch (error) {
            console.error('Error creating army:', error);
            return null;
        }
    }

    /**
     * Remove army from map
     */
    removeArmyFromMap(army) {
        if (army.innerX !== null && army.innerY !== null) {
            this.map[army.x][army.y].innerGrid[army.innerX][army.innerY].army = null;
        }
    }

    /**
     * Start auto-play
     */
    autoPlay() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.autoPlayInterval = setInterval(() => {
            this.nextTurn();
        }, this.gameSpeed);
        
        this.log('Auto-play started');
    }

    /**
     * Pause auto-play
     */
    pause() {
        this.isPlaying = false;
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    /**
     * Reset game
     */
    reset() {
        this.pause();
        this.turn = 0;
        this.gameLog = [];
        this.zoomedSquare = null;
        this.highlightedSquare = null;
        
        // Generate new seed
        this.seed = Math.floor(Math.random() * 1000000);
        this.random = new SeededRandom(this.seed);
        updateURLWithSeed(this.seed);
        
        // Reinitialize
        this.initializeGame();
        
        this.log('Game reset with new seed');
    }

    /**
     * Zoom into a map square
     */
    zoomIntoSquare(x, y) {
        if (x >= 0 && x < GAME_CONFIG.MAP_SIZE && y >= 0 && y < GAME_CONFIG.MAP_SIZE) {
            this.zoomedSquare = { x, y };
            return true;
        }
        return false;
    }

    /**
     * Zoom out to main view
     */
    zoomOut() {
        this.zoomedSquare = null;
        this.highlightedSquare = null;
    }

    /**
     * Highlight a map square
     */
    highlightSquare(x, y, type = 'main', mainX = null, mainY = null) {
        this.highlightedSquare = {
            x, y, type, mainX, mainY
        };
        
        // Auto-clear highlight after 3 seconds
        setTimeout(() => {
            if (this.highlightedSquare && 
                this.highlightedSquare.x === x && 
                this.highlightedSquare.y === y &&
                this.highlightedSquare.type === type) {
                this.highlightedSquare = null;
            }
        }, 3000);
    }

    /**
     * Add message to game log
     */
    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            turn: this.turn,
            message: message,
            timestamp: timestamp
        };
        this.gameLog.push(logEntry);
        console.log(`[T${this.turn}] ${message}`);
        
        // Keep only last 1000 log entries
        if (this.gameLog.length > 1000) {
            this.gameLog = this.gameLog.slice(-1000);
        }
    }

    /**
     * Get game statistics
     */
    getGameStats() {
        const activeNations = this.nations.filter(n => !n.isEliminated());
        const totalPopulation = this.nations.reduce((sum, n) => sum + n.totalPopulation, 0);
        const totalArmies = this.nations.reduce((sum, n) => sum + n.totalArmies, 0);
        const totalBattles = this.battleManager.getAllBattles().length;
        
        return {
            turn: this.turn,
            seed: this.seed,
            activeNations: activeNations.length,
            totalPopulation,
            totalArmies,
            totalBattles,
            performance: this.performanceStats
        };
    }

    /**
     * Export game state for saving
     */
    exportGameState() {
        return {
            seed: this.seed,
            turn: this.turn,
            nations: this.nations.map(n => n.toJSON()),
            gameLog: this.gameLog.slice(-100), // Export recent logs only
            gameStats: this.getGameStats()
        };
    }

    /**
     * Import game state (for loading saved games)
     */
    importGameState(gameState) {
        try {
            this.pause();
            
            this.seed = gameState.seed;
            this.turn = gameState.turn;
            this.gameLog = gameState.gameLog || [];
            
            // Recreate random generator with same seed
            this.random = new SeededRandom(this.seed);
            
            // Recreate nations
            this.nations = gameState.nations.map(nationData => Nation.fromJSON(nationData));
            
            // Regenerate map with same seed
            this.map = this.mapGenerator.generateMap();
            
            this.log('Game state loaded successfully');
            return true;
            
        } catch (error) {
            console.error('Failed to import game state:', error);
            this.log(`Error: Failed to load game state - ${error.message}`);
            return false;
        }
    }
}
