class TetrisGame {
    constructor(canvas, callback) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onComplete = callback;
        
        // Configurações do jogo
        this.blockSize = 30;
        this.cols = 10;
        this.rows = 20;
        this.score = 0;
        this.targetScore = 300; // Pontuação necessária para completar
        
        // Ajustar tamanho do canvas
        this.canvas.width = this.blockSize * this.cols;
        this.canvas.height = this.blockSize * this.rows;
        
        // Grid do jogo
        this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        
        // Peça atual
        this.currentPiece = null;
        
        // Definir peças do Tetris
        this.pieces = [
            [[1,1,1,1]], // I
            [[1,1],[1,1]], // O
            [[1,1,1],[0,1,0]], // T
            [[1,1,1],[1,0,0]], // L
            [[1,1,1],[0,0,1]], // J
            [[1,1,0],[0,1,1]], // S
            [[0,1,1],[1,1,0]]  // Z
        ];
        
        // Cores das peças
        this.colors = [
            '#00f0f0', // Ciano
            '#f0f000', // Amarelo
            '#a000f0', // Roxo
            '#f0a000', // Laranja
            '#0000f0', // Azul
            '#00f000', // Verde
            '#f00000'  // Vermelho
        ];
        
        this.gameLoop = null;
        this.gameOver = false;
        
        this.setupControls();
    }

    start() {
        this.spawnPiece();
        this.gameLoop = setInterval(() => this.update(), 1000);
    }

    spawnPiece() {
        const pieceIndex = Math.floor(Math.random() * this.pieces.length);
        this.currentPiece = {
            shape: this.pieces[pieceIndex],
            color: this.colors[pieceIndex],
            x: Math.floor(this.cols / 2) - Math.floor(this.pieces[pieceIndex][0].length / 2),
            y: 0
        };
        
        if (this.checkCollision()) {
            this.gameOver = true;
            clearInterval(this.gameLoop);
            if (this.score >= this.targetScore) {
                this.onComplete(true);
            } else {
                this.onComplete(false);
            }
        }
    }

    checkCollision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const newX = this.currentPiece.x + x;
                    const newY = this.currentPiece.y + y;
                    
                    if (newX < 0 || newX >= this.cols || 
                        newY >= this.rows ||
                        (newY >= 0 && this.grid[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    merge() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const newY = this.currentPiece.y + y;
                    if (newY >= 0) {
                        this.grid[newY][this.currentPiece.x + x] = this.currentPiece.color;
                    }
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(this.cols).fill(0));
                linesCleared++;
                y++; // Verificar a mesma linha novamente
            }
        }
        
        if (linesCleared > 0) {
            this.score += [40, 100, 300, 1200][linesCleared - 1];
        }
    }

    rotate() {
        const newShape = [];
        for (let x = 0; x < this.currentPiece.shape[0].length; x++) {
            newShape.push([]);
            for (let y = this.currentPiece.shape.length - 1; y >= 0; y--) {
                newShape[x].push(this.currentPiece.shape[y][x]);
            }
        }
        
        const oldShape = this.currentPiece.shape;
        this.currentPiece.shape = newShape;
        
        if (this.checkCollision()) {
            this.currentPiece.shape = oldShape;
        }
    }

    update() {
        this.currentPiece.y++;
        
        if (this.checkCollision()) {
            this.currentPiece.y--;
            this.merge();
            this.clearLines();
            this.spawnPiece();
        }
        
        this.draw();
    }

    draw() {
        // Limpar canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar grid
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x]) {
                    this.ctx.fillStyle = this.grid[y][x];
                    this.ctx.fillRect(
                        x * this.blockSize,
                        y * this.blockSize,
                        this.blockSize - 1,
                        this.blockSize - 1
                    );
                }
            }
        }
        
        // Desenhar peça atual
        if (this.currentPiece) {
            this.ctx.fillStyle = this.currentPiece.color;
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.ctx.fillRect(
                            (this.currentPiece.x + x) * this.blockSize,
                            (this.currentPiece.y + y) * this.blockSize,
                            this.blockSize - 1,
                            this.blockSize - 1
                        );
                    }
                }
            }
        }
        
        // Desenhar pontuação
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 25);
        this.ctx.fillText(`Target: ${this.targetScore}`, 10, 50);
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.currentPiece.x--;
                    if (this.checkCollision()) {
                        this.currentPiece.x++;
                    }
                    break;
                case 'ArrowRight':
                    this.currentPiece.x++;
                    if (this.checkCollision()) {
                        this.currentPiece.x--;
                    }
                    break;
                case 'ArrowDown':
                    this.currentPiece.y++;
                    if (this.checkCollision()) {
                        this.currentPiece.y--;
                        this.merge();
                        this.clearLines();
                        this.spawnPiece();
                    }
                    break;
                case 'ArrowUp':
                    this.rotate();
                    break;
            }
            
            this.draw();
        });
    }

    stop() {
        clearInterval(this.gameLoop);
        this.gameOver = true;
    }
}
