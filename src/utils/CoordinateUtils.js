/**
 * Coordinate manipulation utilities
 */

import { GAME_CONFIG } from './Constants.js';

export function getDistance(pos1, pos2) {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}

export function getManhattanDistance(pos1, pos2) {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

export function getNeighbors(x, y, size = GAME_CONFIG.MAP_SIZE) {
    const neighbors = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dx, dy] of directions) {
        const newX = x + dx;
        const newY = y + dy;
        if (newX >= 0 && newX < size && newY >= 0 && newY < size) {
            neighbors.push({ x: newX, y: newY });
        }
    }
    
    return neighbors;
}

export function getNeighborsWithDiagonals(x, y, size = GAME_CONFIG.MAP_SIZE) {
    const neighbors = [];
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [dx, dy] of directions) {
        const newX = x + dx;
        const newY = y + dy;
        if (newX >= 0 && newX < size && newY >= 0 && newY < size) {
            neighbors.push({ x: newX, y: newY });
        }
    }
    
    return neighbors;
}

export function isValidPosition(x, y, size = GAME_CONFIG.MAP_SIZE) {
    return x >= 0 && x < size && y >= 0 && y < size;
}

export function findPath(start, end, isPassable, size = GAME_CONFIG.MAP_SIZE) {
    // Simple A* pathfinding implementation
    const openSet = [start];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    const getKey = (pos) => `${pos.x},${pos.y}`;
    
    gScore.set(getKey(start), 0);
    fScore.set(getKey(start), getManhattanDistance(start, end));
    
    while (openSet.length > 0) {
        // Get node with lowest fScore
        let current = openSet[0];
        let currentIndex = 0;
        
        for (let i = 1; i < openSet.length; i++) {
            if (fScore.get(getKey(openSet[i])) < fScore.get(getKey(current))) {
                current = openSet[i];
                currentIndex = i;
            }
        }
        
        if (current.x === end.x && current.y === end.y) {
            // Reconstruct path
            const path = [];
            let node = current;
            while (node) {
                path.unshift(node);
                node = cameFrom.get(getKey(node));
            }
            return path;
        }
        
        openSet.splice(currentIndex, 1);
        
        for (const neighbor of getNeighbors(current.x, current.y, size)) {
            if (!isPassable(neighbor.x, neighbor.y)) continue;
            
            const tentativeGScore = gScore.get(getKey(current)) + 1;
            const neighborKey = getKey(neighbor);
            
            if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + getManhattanDistance(neighbor, end));
                
                if (!openSet.some(pos => pos.x === neighbor.x && pos.y === neighbor.y)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    
    return []; // No path found
}

export function getRandomPosition(random, size = GAME_CONFIG.MAP_SIZE) {
    return {
        x: random.randomInt(0, size - 1),
        y: random.randomInt(0, size - 1)
    };
}

export function getPositionsInRadius(center, radius, size = GAME_CONFIG.MAP_SIZE) {
    const positions = [];
    
    for (let x = Math.max(0, center.x - radius); x <= Math.min(size - 1, center.x + radius); x++) {
        for (let y = Math.max(0, center.y - radius); y <= Math.min(size - 1, center.y + radius); y++) {
            if (getDistance(center, { x, y }) <= radius) {
                positions.push({ x, y });
            }
        }
    }
    
    return positions;
}
