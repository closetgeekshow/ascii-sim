/**
 * Simple renderer for testing
 */

export class Renderer {
    constructor(game) {
        this.game = game;
        this.canvas = null;
        this.ctx = null;
    }

    initializeCanvas(container) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.canvas.style.border = '2px solid #00ff00';
        this.ctx = this.canvas.getContext('2d');
        container.appendChild(this.canvas);
    }

    render() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Simple render - just show it works
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '16px Courier New';
        this.ctx.fillText('Refactored Game Working!', 50, 200);
        this.ctx.fillText(`Turn: ${this.game.turn}`, 50, 220);
        this.ctx.fillText(`Seed: ${this.game.seed}`, 50, 240);
    }

    handleResize() {
        // Handle resize
    }
}
