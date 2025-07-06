/**
 * Game constants and configuration
 */

export const TERRAIN_TYPES = ['land', 'ocean', 'mountain', 'river'];
export const DEVELOPMENT_TYPES = ['none', 'farm', 'mine', 'forest', 'town', 'city', 'castle'];
export const ORDER_TYPES = ['move', 'attack', 'defend', 'build', null];
export const RESOURCE_TYPES = ['gold', 'wood', 'food', 'metal'];

export const GAME_CONFIG = {
    MAP_SIZE: 10,
    INNER_SIZE: 10,
    NATION_COUNT: 4,
    MIN_NATION_DISTANCE: 3,
    OCEAN_REGIONS: 3,
    RIVER_COUNT: 2,
    MOUNTAIN_COUNT: 5,
    ARMY_MOVEMENT_POINTS: 3,
    ARMY_UPKEEP: 2,
    TERRITORY_UPKEEP: 1
};

export const NATION_CONFIG = {
    names: ['Red Empire', 'Blue Kingdom', 'Green Republic', 'Yellow Federation'],
    colors: ['🟥', '🟦', '🟩', '🟨'],
    bgColors: ['#440000', '#000044', '#004400', '#444400'],
    startingResources: {
        gold: 100,
        wood: 50,
        food: 50,
        metal: 30
    }
};

export const TERRAIN_CONFIG = {
    ocean: {
        symbol: '~',
        color: '#000044',
        movementSpeed: 0.25,
        passable: true
    },
    mountain: {
        symbol: '^',
        color: '#444400',
        movementSpeed: 0,
        passable: false,
        mineEfficiency: 0.2
    },
    river: {
        symbol: '≈',
        color: '#004444',
        movementSpeed: 3,
        passable: true,
        foodBonus: 2
    },
    land: {
        symbol: '·',
        color: '#002200',
        movementSpeed: 1,
        passable: true
    }
};

export const DEVELOPMENT_CONFIG = {
    farm: { symbol: '🌾', foodBonus: 3 },
    mine: { symbol: '⛏', metalBonus: 2 },
    forest: { symbol: '🌲', woodBonus: 2 },
    town: { symbol: '🏠', maxArmyLevel: 3, goldPerPop: 100 },
    city: { symbol: '🏛', maxArmyLevel: 10, goldPerPop: 50 },
    castle: { symbol: '🏰', defenseBonus: 3 }
};
