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
        console.log('Initializing canvas...');
        this.canvas = document.createElement('canvas');
        
        // Make canvas responsive
        const containerWidth = Math.min(400, window.innerWidth - 60);
        const canvasSize = Math.max(280, Math.min(400, containerWidth));
        
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        this.canvas.style.cssText = `
            border: 2px solid #00ff00;
            background: #000;
            display: block;
            max-width: 100%;
            height: auto;
        `;
        
        this.ctx = this.canvas.getContext('2d');
        console.log('Canvas context created:', !!this.ctx);
        
        // Add title
        const title = document.createElement('div');
        title.textContent = 'World Map';
        title.style.cssText = `
            color: #00ff00;
            font-size: 14px;
            margin-bottom: 10px;
            text-align: center;
        `;
        
        container.appendChild(title);
        container.appendChild(this.canvas);
        
        // Test render immediately
        this.testRender();
        
        console.log('Canvas initialized, size:', canvasSize);
    }
    
    testRender() {
        if (!this.ctx) return;
        
        console.log('Test rendering...');
        // Draw a simple test pattern
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(10, 10, 50, 50);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillText('TEST', 70, 30);
    }

    render() {
        if (!this.ctx) {
            console.warn('No canvas context available');
            return;
        }
        
        if (!this.game.map) {
            console.warn('No game map available');
            return;
        }
        
        // Clear canvas with a visible background
        this.ctx.fillStyle = '#001100';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw border to make sure canvas is visible
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(1, 1, this.canvas.width - 2, this.canvas.height - 2);
        
        // Render the actual game map
        this.renderMap();
    }
    
    renderMap() {
        const cellSize = this.canvas.width / 10; // Dynamic cell size based on canvas
        const map = this.game.map;
        
        if (!map) {
            console.warn('No map data in renderMap');
            return;
        }
        
        console.log('Rendering map, cell size:', cellSize);
        console.log('Map sample cell (0,0):', map[0][0]);
        
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                const cell = map[x][y];
                const screenX = x * cellSize;
                const screenY = y * cellSize;
                
                // Draw cell background based on owner
                if (cell.owner !== null) {
                    const nation = this.game.nations[cell.owner];
                    this.ctx.fillStyle = nation.getColor();
                    console.log(`Cell (${x},${y}) owned by ${nation.name} - color: ${nation.getColor()}`);
                } else {
                    // Color based on terrain
                    switch (cell.terrain) {
                        case 'ocean': this.ctx.fillStyle = '#000044'; break;
                        case 'mountain': this.ctx.fillStyle = '#444400'; break;
                        case 'river': this.ctx.fillStyle = '#004444'; break;
                        default: this.ctx.fillStyle = '#002200'; break;
                    }
                }
                
                this.ctx.fillRect(screenX, screenY, cellSize, cellSize);
                
                // Draw border
                this.ctx.strokeStyle = '#004400';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(screenX, screenY, cellSize, cellSize);
                
                // Draw symbol
                this.ctx.fillStyle = '#00ff00';
                const fontSize = Math.max(12, cellSize * 0.4);
                this.ctx.font = `${fontSize}px Courier New`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                let symbol = this.getCellSymbol(cell);
                this.ctx.fillText(symbol, screenX + cellSize/2, screenY + cellSize/2);
            }
        }
        
        // Add map info
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px Courier New';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Turn: ${this.game.turn}`, 5, this.canvas.height - 5);
    }
    
    getCellSymbol(cell) {
        // Show nation symbol if owned
        if (cell.owner !== null) {
            return this.game.nations[cell.owner].symbol;
        }
        
        // Show terrain symbol
        switch (cell.terrain) {
            case 'ocean': return '~';
            case 'mountain': return '^';
            case 'river': return '≈';
            default: return '·';
        }
    }

    handleResize() {
        // Handle resize
    }
}
