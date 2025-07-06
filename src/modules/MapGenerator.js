/**
 * Enhanced map and terrain generation with proper ocean/river logic
 */

import { GAME_CONFIG, TERRAIN_CONFIG } from '../utils/Constants.js';
import { validateTerrain } from '../utils/ValidationUtils.js';
import { getRandomPosition, getNeighbors, findPath, isValidPosition } from '../utils/CoordinateUtils.js';

export class MapGenerator {
    constructor(random) {
        this.random = random;
        this.MAP_SIZE = GAME_CONFIG.MAP_SIZE;
        this.INNER_SIZE = GAME_CONFIG.INNER_SIZE;
    }

    /**
     * Generate complete map with terrain features
     */
    generateMap() {
        const map = this.initializeEmptyMap();
        
        // Generate terrain features in order
        this.generateOceanRegions(map);
        this.generateMountains(map);
        this.generateRiverSystems(map);
        this.generateResources(map);
        
        return map;
    }

    /**
     * Initialize empty map structure
     */
    initializeEmptyMap() {
        const map = [];
        for (let i = 0; i < this.MAP_SIZE; i++) {
            map[i] = [];
            for (let j = 0; j < this.MAP_SIZE; j++) {
                map[i][j] = {
                    owner: null,
                    terrain: validateTerrain('land'),
                    resources: { gold: 0, wood: 0, food: 0, metal: 0 },
                    development: 'none',
                    army: null,
                    population: 0,
                    innerGrid: this.generateInnerGrid('land')
                };
            }
        }
        return map;
    }

    /**
     * Generate inner grid for a main cell
     */
    generateInnerGrid(mainTerrain) {
        const inner = [];
        for (let i = 0; i < this.INNER_SIZE; i++) {
            inner[i] = [];
            for (let j = 0; j < this.INNER_SIZE; j++) {
                inner[i][j] = {
                    terrain: this.generateInnerTerrain(mainTerrain),
                    resources: this.random.probability(0.2) ? this.getRandomResource() : null,
                    development: 'none',
                    army: null,
                    population: 0,
                    road: false,
                    level: 1
                };
            }
        }
        return inner;
    }

    /**
     * Generate inner terrain based on main terrain type
     */
    generateInnerTerrain(mainTerrain) {
        if (mainTerrain === 'ocean') {
            return 'ocean'; // All ocean tiles are 100% water
        } else if (mainTerrain === 'river') {
            // Rivers are mostly land with water channels
            return this.random.probability(0.15) ? 'river' : 'land';
        } else {
            // Land and mountain tiles have varied inner terrain
            const roll = this.random.random();
            if (roll < 0.05) return 'mountain';
            else if (roll < 0.10) return 'river';
            else return mainTerrain;
        }
    }

    /**
     * Generate 2-3 large ocean regions
     */
    generateOceanRegions(map) {
        const oceanCount = GAME_CONFIG.OCEAN_REGIONS;
        const generatedRegions = [];

        for (let i = 0; i < oceanCount; i++) {
            let attempts = 0;
            let regionGenerated = false;

            while (!regionGenerated && attempts < 50) {
                const centerX = this.random.randomInt(1, this.MAP_SIZE - 3);
                const centerY = this.random.randomInt(1, this.MAP_SIZE - 3);
                const size = this.random.randomInt(2, 4); // 2x2 to 4x4 regions

                // Check if this region conflicts with existing oceans
                let conflicts = false;
                for (let x = centerX; x < centerX + size && x < this.MAP_SIZE; x++) {
                    for (let y = centerY; y < centerY + size && y < this.MAP_SIZE; y++) {
                        if (map[x][y].terrain === 'ocean') {
                            conflicts = true;
                            break;
                        }
                    }
                    if (conflicts) break;
                }

                if (!conflicts) {
                    // Create ocean region
                    for (let x = centerX; x < centerX + size && x < this.MAP_SIZE; x++) {
                        for (let y = centerY; y < centerY + size && y < this.MAP_SIZE; y++) {
                            map[x][y].terrain = validateTerrain('ocean');
                            map[x][y].innerGrid = this.generateOceanInnerGrid();
                        }
                    }
                    generatedRegions.push({ x: centerX, y: centerY, size });
                    regionGenerated = true;
                }
                attempts++;
            }
        }

        return generatedRegions;
    }

    /**
     * Generate inner grid for ocean tiles (100% water)
     */
    generateOceanInnerGrid() {
        const inner = [];
        for (let i = 0; i < this.INNER_SIZE; i++) {
            inner[i] = [];
            for (let j = 0; j < this.INNER_SIZE; j++) {
                inner[i][j] = {
                    terrain: validateTerrain('ocean'),
                    resources: null,
                    development: 'none',
                    army: null,
                    population: 0,
                    road: false,
                    level: 1
                };
            }
        }
        return inner;
    }

    /**
     * Generate mountain regions
     */
    generateMountains(map) {
        for (let i = 0; i < GAME_CONFIG.MOUNTAIN_COUNT; i++) {
            let attempts = 0;
            while (attempts < 20) {
                const pos = getRandomPosition(this.random, this.MAP_SIZE);
                
                if (map[pos.x][pos.y].terrain === 'land') {
                    map[pos.x][pos.y].terrain = validateTerrain('mountain');
                    map[pos.x][pos.y].innerGrid = this.generateMountainInnerGrid();
                    break;
                }
                attempts++;
            }
        }
    }

    /**
     * Generate inner grid for mountain tiles
     */
    generateMountainInnerGrid() {
        const inner = [];
        for (let i = 0; i < this.INNER_SIZE; i++) {
            inner[i] = [];
            for (let j = 0; j < this.INNER_SIZE; j++) {
                const terrain = this.random.probability(0.8) ? 'mountain' : 'land';
                inner[i][j] = {
                    terrain: validateTerrain(terrain),
                    resources: terrain === 'mountain' && this.random.probability(0.3) ? 'metal' : null,
                    development: 'none',
                    army: null,
                    population: 0,
                    road: false,
                    level: 1
                };
            }
        }
        return inner;
    }

    /**
     * Generate river systems that connect to oceans
     */
    generateRiverSystems(map) {
        const oceans = this.findOceanTiles(map);
        if (oceans.length === 0) return;

        for (let i = 0; i < GAME_CONFIG.RIVER_COUNT; i++) {
            this.generateSingleRiver(map, oceans);
        }
    }

    /**
     * Find all ocean tiles on the map
     */
    findOceanTiles(map) {
        const oceans = [];
        for (let x = 0; x < this.MAP_SIZE; x++) {
            for (let y = 0; y < this.MAP_SIZE; y++) {
                if (map[x][y].terrain === 'ocean') {
                    oceans.push({ x, y });
                }
            }
        }
        return oceans;
    }

    /**
     * Generate a single river from inland to nearest ocean
     */
    generateSingleRiver(map, oceans) {
        // Find a valid inland starting point
        let startPos = null;
        let attempts = 0;

        while (!startPos && attempts < 50) {
            const pos = getRandomPosition(this.random, this.MAP_SIZE);
            
            if (map[pos.x][pos.y].terrain === 'land') {
                // Check if it's inland (not adjacent to ocean)
                const neighbors = getNeighbors(pos.x, pos.y, this.MAP_SIZE);
                const adjacentToOcean = neighbors.some(neighbor => 
                    map[neighbor.x][neighbor.y].terrain === 'ocean'
                );
                
                if (!adjacentToOcean) {
                    startPos = pos;
                }
            }
            attempts++;
        }

        if (!startPos) return;

        // Find nearest ocean
        let nearestOcean = oceans[0];
        let minDistance = Infinity;

        for (const ocean of oceans) {
            const distance = Math.sqrt(
                Math.pow(startPos.x - ocean.x, 2) + 
                Math.pow(startPos.y - ocean.y, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                nearestOcean = ocean;
            }
        }

        // Create river path using pathfinding
        const isPassable = (x, y) => {
            return isValidPosition(x, y, this.MAP_SIZE) && 
                   (map[x][y].terrain === 'land' || map[x][y].terrain === 'ocean');
        };

        const path = findPath(startPos, nearestOcean, isPassable, this.MAP_SIZE);

        // Convert path to river tiles (except ocean endpoint)
        for (let i = 0; i < path.length - 1; i++) {
            const pos = path[i];
            if (map[pos.x][pos.y].terrain === 'land') {
                map[pos.x][pos.y].terrain = validateTerrain('river');
                map[pos.x][pos.y].innerGrid = this.generateRiverInnerGrid();
                map[pos.x][pos.y].resources.food += TERRAIN_CONFIG.river.foodBonus;
            }
        }
    }

    /**
     * Generate inner grid for river tiles with water channels
     */
    generateRiverInnerGrid() {
        const inner = [];
        
        // Create mostly land with 1-2 water channels
        for (let i = 0; i < this.INNER_SIZE; i++) {
            inner[i] = [];
            for (let j = 0; j < this.INNER_SIZE; j++) {
                inner[i][j] = {
                    terrain: validateTerrain('land'),
                    resources: this.random.probability(0.25) ? 'food' : null,
                    development: 'none',
                    army: null,
                    population: 0,
                    road: false,
                    level: 1
                };
            }
        }

        // Add water channels
        this.addWaterChannels(inner);
        
        return inner;
    }

    /**
     * Add 1-2 contiguous water channels to river inner grid
     */
    addWaterChannels(inner) {
        const channelCount = this.random.randomInt(1, 2);
        
        for (let channel = 0; channel < channelCount; channel++) {
            // Choose channel direction (horizontal or vertical)
            const isHorizontal = this.random.probability(0.5);
            
            if (isHorizontal) {
                // Horizontal channel
                const row = this.random.randomInt(2, this.INNER_SIZE - 3);
                const width = this.random.randomInt(1, 2);
                
                for (let x = 0; x < this.INNER_SIZE; x++) {
                    for (let w = 0; w < width && row + w < this.INNER_SIZE; w++) {
                        inner[x][row + w].terrain = validateTerrain('river');
                        inner[x][row + w].resources = 'food';
                    }
                }
            } else {
                // Vertical channel
                const col = this.random.randomInt(2, this.INNER_SIZE - 3);
                const width = this.random.randomInt(1, 2);
                
                for (let y = 0; y < this.INNER_SIZE; y++) {
                    for (let w = 0; w < width && col + w < this.INNER_SIZE; w++) {
                        inner[col + w][y].terrain = validateTerrain('river');
                        inner[col + w][y].resources = 'food';
                    }
                }
            }
        }
    }

    /**
     * Generate resources across the map
     */
    generateResources(map) {
        for (let x = 0; x < this.MAP_SIZE; x++) {
            for (let y = 0; y < this.MAP_SIZE; y++) {
                const cell = map[x][y];
                
                // Main cell resources based on terrain
                switch (cell.terrain) {
                    case 'land':
                        cell.resources.wood = this.random.randomInt(1, 5);
                        cell.resources.food = this.random.randomInt(1, 3);
                        break;
                    case 'mountain':
                        cell.resources.metal = this.random.randomInt(2, 8);
                        break;
                    case 'river':
                        cell.resources.food = this.random.randomInt(3, 6);
                        break;
                }
                
                // Random gold deposits
                if (this.random.probability(0.15)) {
                    cell.resources.gold = this.random.randomInt(1, 3);
                }
            }
        }
    }

    /**
     * Get random resource type
     */
    getRandomResource() {
        const resources = ['gold', 'wood', 'food', 'metal'];
        return this.random.choice(resources);
    }

    /**
     * Regenerate inner grid for a specific terrain type
     */
    regenerateInnerGrid(terrain) {
        switch (terrain) {
            case 'ocean':
                return this.generateOceanInnerGrid();
            case 'mountain':
                return this.generateMountainInnerGrid();
            case 'river':
                return this.generateRiverInnerGrid();
            default:
                return this.generateInnerGrid('land');
        }
    }
}
