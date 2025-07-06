/**
 * Input validation and sanitization utilities
 */

import { TERRAIN_TYPES, DEVELOPMENT_TYPES, ORDER_TYPES, RESOURCE_TYPES } from './Constants.js';

export function validateTerrain(terrain) {
    if (!TERRAIN_TYPES.includes(terrain)) {
        console.warn(`Invalid terrain type: ${terrain}. Using 'land' as fallback.`);
        return 'land';
    }
    return terrain;
}

export function validateDevelopment(development) {
    if (!DEVELOPMENT_TYPES.includes(development)) {
        console.warn(`Invalid development type: ${development}. Using 'none' as fallback.`);
        return 'none';
    }
    return development;
}

export function validateOrder(order) {
    if (!ORDER_TYPES.includes(order)) {
        console.warn(`Invalid order type: ${order}. Using null as fallback.`);
        return null;
    }
    return order;
}

export function validateResource(resource) {
    if (!RESOURCE_TYPES.includes(resource)) {
        console.warn(`Invalid resource type: ${resource}. Using 'gold' as fallback.`);
        return 'gold';
    }
    return resource;
}

export function validateCoordinates(x, y, maxSize) {
    const validX = Math.max(0, Math.min(maxSize - 1, Math.floor(x)));
    const validY = Math.max(0, Math.min(maxSize - 1, Math.floor(y)));
    
    if (validX !== x || validY !== y) {
        console.warn(`Invalid coordinates (${x}, ${y}). Clamped to (${validX}, ${validY}).`);
    }
    
    return { x: validX, y: validY };
}

export function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function validateNationId(nationId, maxNations) {
    const id = parseInt(nationId);
    if (isNaN(id) || id < 0 || id >= maxNations) {
        console.warn(`Invalid nation ID: ${nationId}. Using 0 as fallback.`);
        return 0;
    }
    return id;
}

export function validateArmyLevel(level) {
    const validLevel = Math.max(1, Math.min(10, Math.floor(level)));
    if (validLevel !== level) {
        console.warn(`Invalid army level: ${level}. Clamped to ${validLevel}.`);
    }
    return validLevel;
}

export function validateResources(resources) {
    const validated = {};
    for (const resourceType of RESOURCE_TYPES) {
        validated[resourceType] = Math.max(0, Math.floor(resources[resourceType] || 0));
    }
    return validated;
}
