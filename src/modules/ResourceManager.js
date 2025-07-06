/**
 * Resource collection, transport, and management system
 */

import { GAME_CONFIG, DEVELOPMENT_CONFIG, TERRAIN_CONFIG } from '../utils/Constants.js';
import { validateResources } from '../utils/ValidationUtils.js';

export class ResourceManager {
    constructor() {
        this.initialized = false;
        this.map = null;
        this.nations = null;
    }

    /**
     * Initialize the resource manager
     */
    initialize(map, nations) {
        this.map = map;
        this.nations = nations;
        this.initialized = true;
    }

    /**
     * Collect resources for a nation
     */
    collectResources(nation, map) {
        if (!this.initialized) return;

        const collected = { gold: 0, wood: 0, food: 0, metal: 0 };

        for (const territory of nation.territory) {
            const cell = map[territory.x][territory.y];
            
            // Collect from main cell
            this.collectFromCell(cell, collected);
            
            // Collect from inner grid
            this.collectFromInnerGrid(cell, collected);
        }

        // Apply collected resources
        nation.addResources(collected);
        
        return collected;
    }

    /**
     * Collect resources from main cell
     */
    collectFromCell(cell, collected) {
        // Base collection from terrain
        collected.gold += cell.resources.gold;
        collected.wood += cell.resources.wood;
        collected.food += cell.resources.food;
        collected.metal += cell.resources.metal;

        // Development bonuses
        switch (cell.development) {
            case 'farm':
                collected.food += DEVELOPMENT_CONFIG.farm.foodBonus;
                break;
            case 'mine':
                collected.metal += DEVELOPMENT_CONFIG.mine.metalBonus;
                break;
            case 'forest':
                collected.wood += DEVELOPMENT_CONFIG.forest.woodBonus;
                break;
        }
    }

    /**
     * Collect resources from inner grid
     */
    collectFromInnerGrid(cell, collected) {
        for (let i = 0; i < GAME_CONFIG.INNER_SIZE; i++) {
            for (let j = 0; j < GAME_CONFIG.INNER_SIZE; j++) {
                const innerCell = cell.innerGrid[i][j];
                
                // Resource collection from inner cells
                if (innerCell.resources) {
                    collected[innerCell.resources] = (collected[innerCell.resources] || 0) + 1;
                }

                // Development bonuses from inner cells
                switch (innerCell.development) {
                    case 'farm':
                        collected.food += 1;
                        break;
                    case 'mine':
                        const efficiency = innerCell.terrain === 'mountain' ? 2 : 1;
                        collected.metal += efficiency;
                        break;
                    case 'forest':
                        collected.wood += 1;
                        break;
                    case 'town':
                        collected.gold += Math.floor(innerCell.population / DEVELOPMENT_CONFIG.town.goldPerPop);
                        break;
                    case 'city':
                        collected.gold += Math.floor(innerCell.population / DEVELOPMENT_CONFIG.city.goldPerPop);
                        break;
                }
            }
        }
    }

    /**
     * Pay upkeep costs for a nation
     */
    payUpkeep(nation) {
        const armyUpkeep = nation.armies.length * GAME_CONFIG.ARMY_UPKEEP;
        const territoryUpkeep = nation.territory.length * GAME_CONFIG.TERRITORY_UPKEEP;
        const totalUpkeep = armyUpkeep + territoryUpkeep;

        nation.addResources({ gold: -totalUpkeep });
        
        return totalUpkeep;
    }

    /**
     * Calculate resource scarcity across the map
     */
    calculateResourceScarcity() {
        const totalResources = { gold: 0, wood: 0, food: 0, metal: 0 };
        let totalCells = 0;

        for (let x = 0; x < GAME_CONFIG.MAP_SIZE; x++) {
            for (let y = 0; y < GAME_CONFIG.MAP_SIZE; y++) {
                const cell = this.map[x][y];
                totalCells++;
                
                totalResources.gold += cell.resources.gold;
                totalResources.wood += cell.resources.wood;
                totalResources.food += cell.resources.food;
                totalResources.metal += cell.resources.metal;
            }
        }

        // Calculate scarcity (inverse of abundance)
        const scarcity = {};
        for (const [resource, total] of Object.entries(totalResources)) {
            scarcity[resource] = Math.max(0, 1 - (total / (totalCells * 3))); // Assuming 3 is average abundance
        }

        return scarcity;
    }

    /**
     * Transport resources via roads
     */
    transportResources(nation, map) {
        // Simplified road transport - roads increase resource efficiency
        for (const territory of nation.territory) {
            const cell = map[territory.x][territory.y];
            const roadCount = this.countRoads(cell);
            
            if (roadCount > 0) {
                const bonus = Math.floor(roadCount / 5); // 1 bonus per 5 road segments
                nation.addResources({ 
                    gold: bonus,
                    wood: bonus,
                    food: bonus,
                    metal: bonus
                });
            }
        }
    }

    /**
     * Count roads in a cell's inner grid
     */
    countRoads(cell) {
        let roadCount = 0;
        
        for (let i = 0; i < GAME_CONFIG.INNER_SIZE; i++) {
            for (let j = 0; j < GAME_CONFIG.INNER_SIZE; j++) {
                if (cell.innerGrid[i][j].road) {
                    roadCount++;
                }
            }
        }
        
        return roadCount;
    }

    /**
     * Get resource value based on scarcity
     */
    getResourceValue(resource, scarcity) {
        const baseValue = 1;
        const scarcityMultiplier = 1 + (scarcity[resource] || 0) * 2;
        return baseValue * scarcityMultiplier;
    }
}
