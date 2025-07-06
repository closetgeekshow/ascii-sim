/**
 * Nation class with enhanced functionality
 */

import { NATION_CONFIG } from '../utils/Constants.js';
import { validateResources, validateNationId } from '../utils/ValidationUtils.js';

export class Nation {
    constructor(id, name = null, symbol = null) {
        this.id = validateNationId(id, NATION_CONFIG.names.length);
        this.name = name || NATION_CONFIG.names[this.id];
        this.symbol = symbol || NATION_CONFIG.colors[this.id];
        
        this.resources = validateResources({ ...NATION_CONFIG.startingResources });
        this.territory = [];
        this.armies = [];
        this.capital = null;
        
        // Statistics
        this.totalTerritory = 0;
        this.totalArmies = 0;
        this.totalPopulation = 0;
        
        // Diplomacy and relations
        this.diplomacy = {}; // nationId -> 'neutral', 'war', 'peace', 'trade'
        this.tradeOffers = [];
        this.battles = [];
        
        // AI state
        this.aiState = {
            priorities: {
                expansion: 0.3,
                military: 0.2,
                economy: 0.3,
                diplomacy: 0.2
            },
            lastActions: [],
            targetResources: { ...NATION_CONFIG.startingResources }
        };
    }

    /**
     * Add territory to this nation
     */
    addTerritory(x, y) {
        if (!this.hasTerritory(x, y)) {
            this.territory.push({ x, y });
            this.totalTerritory = this.territory.length;
        }
    }

    /**
     * Remove territory from this nation
     */
    removeTerritory(x, y) {
        this.territory = this.territory.filter(t => !(t.x === x && t.y === y));
        this.totalTerritory = this.territory.length;
    }

    /**
     * Check if nation controls given territory
     */
    hasTerritory(x, y) {
        return this.territory.some(t => t.x === x && t.y === y);
    }

    /**
     * Add army to this nation
     */
    addArmy(army) {
        this.armies.push(army);
        this.totalArmies = this.armies.length;
    }

    /**
     * Remove army from this nation
     */
    removeArmy(army) {
        const index = this.armies.indexOf(army);
        if (index > -1) {
            this.armies.splice(index, 1);
            this.totalArmies = this.armies.length;
        }
    }

    /**
     * Add resources to nation (can be negative for spending)
     */
    addResources(resourceChanges) {
        for (const [resource, amount] of Object.entries(resourceChanges)) {
            this.resources[resource] = Math.max(0, this.resources[resource] + amount);
        }
    }

    /**
     * Check if nation can afford given resources
     */
    canAfford(cost) {
        for (const [resource, amount] of Object.entries(cost)) {
            if (this.resources[resource] < amount) {
                return false;
            }
        }
        return true;
    }

    /**
     * Spend resources (returns true if successful)
     */
    spendResources(cost) {
        if (!this.canAfford(cost)) {
            return false;
        }
        
        for (const [resource, amount] of Object.entries(cost)) {
            this.resources[resource] -= amount;
        }
        return true;
    }

    /**
     * Get diplomatic relationship with another nation
     */
    getDiplomaticRelation(nationId) {
        return this.diplomacy[nationId] || 'neutral';
    }

    /**
     * Set diplomatic relationship with another nation
     */
    setDiplomaticRelation(nationId, relation) {
        const validRelations = ['neutral', 'trade', 'war', 'peace'];
        if (validRelations.includes(relation)) {
            this.diplomacy[nationId] = relation;
        }
    }

    /**
     * Add trade offer
     */
    addTradeOffer(offer) {
        this.tradeOffers.push({
            ...offer,
            receivedTurn: offer.turn
        });
    }

    /**
     * Remove trade offer
     */
    removeTradeOffer(offer) {
        const index = this.tradeOffers.indexOf(offer);
        if (index > -1) {
            this.tradeOffers.splice(index, 1);
        }
    }

    /**
     * Get expired trade offers
     */
    getExpiredTradeOffers(currentTurn, maxAge = 3) {
        return this.tradeOffers.filter(offer => 
            currentTurn - offer.receivedTurn > maxAge
        );
    }

    /**
     * Clean up expired trade offers
     */
    cleanupExpiredTradeOffers(currentTurn, maxAge = 3) {
        this.tradeOffers = this.tradeOffers.filter(offer => 
            currentTurn - offer.receivedTurn <= maxAge
        );
    }

    /**
     * Add battle to history
     */
    addBattle(battle) {
        this.battles.push(battle);
    }

    /**
     * Get recent battles
     */
    getRecentBattles(count = 10) {
        return this.battles.slice(-count).reverse();
    }

    /**
     * Update nation statistics
     */
    updateStatistics(map) {
        this.totalTerritory = this.territory.length;
        this.totalArmies = this.armies.length;
        
        // Calculate total population
        this.totalPopulation = 0;
        for (const territory of this.territory) {
            const cell = map[territory.x][territory.y];
            this.totalPopulation += cell.population || 0;
            
            // Add inner grid population
            if (cell.innerGrid) {
                for (let i = 0; i < cell.innerGrid.length; i++) {
                    for (let j = 0; j < cell.innerGrid[i].length; j++) {
                        this.totalPopulation += cell.innerGrid[i][j].population || 0;
                    }
                }
            }
        }
    }

    /**
     * Check if nation is eliminated
     */
    isEliminated() {
        return this.totalTerritory === 0;
    }

    /**
     * Get nation's color for display
     */
    getColor() {
        return NATION_CONFIG.bgColors[this.id] || '#002200';
    }

    /**
     * Get resource scarcity (0-1, where 1 is most scarce)
     */
    getResourceScarcity(resource) {
        const target = this.aiState.targetResources[resource] || 50;
        const current = this.resources[resource];
        return Math.max(0, 1 - (current / target));
    }

    /**
     * Get nation strength rating
     */
    getStrengthRating() {
        let strength = 0;
        strength += this.totalTerritory * 10;
        strength += this.totalArmies * 20;
        strength += this.totalPopulation * 0.01;
        strength += (this.resources.gold + this.resources.wood + 
                    this.resources.food + this.resources.metal) * 0.1;
        return Math.floor(strength);
    }

    /**
     * Get JSON representation for saving/loading
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            symbol: this.symbol,
            resources: this.resources,
            territory: this.territory,
            capital: this.capital,
            diplomacy: this.diplomacy,
            aiState: this.aiState,
            battles: this.battles.slice(-20) // Keep only recent battles
        };
    }

    /**
     * Load from JSON representation
     */
    static fromJSON(data) {
        const nation = new Nation(data.id, data.name, data.symbol);
        nation.resources = data.resources;
        nation.territory = data.territory || [];
        nation.capital = data.capital;
        nation.diplomacy = data.diplomacy || {};
        nation.aiState = data.aiState || nation.aiState;
        nation.battles = data.battles || [];
        return nation;
    }
}
