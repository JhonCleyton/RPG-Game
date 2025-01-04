class CarGame {
    constructor(canvas, callback) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onComplete = callback;
        
        // Configurações do jogo
        this.width = 400;
        this.height = 600;
        this.score = 0;
        this.targetScore = 400;
        this.speed = 5;
        this.gameOver = false;
        
        // Ajustar tamanho do canvas
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Carro do jogador
        this.car = {
            x: this.width / 2 - 25,
            y: this.height - 100,
            width: 50,
            height: 80,
            speed: 5
        };
        
        // Obstáculos
        this.obstacles = [];
        this.obstacleTypes = [
            { width: 60, height: 60, color: '#f00', points: 10 }, // Cones
            { width: 100, height: 40, color: '#800', points: 20 }, // Barreiras
            { width: 40, height: 80, color: '#888', points: 30 }  // Carros
        ];
        
        // Controles
        this.keys = {
            left: false,
            right: false
        };
        
        this.setupControls();
        this.gameLoop = null;
    }

    start() {
        this.gameLoop = setInterval(() => this.update(), 1000 / 60);
        this.spawnObstacle();
    }

    spawnObstacle() {
        if (this.gameOver) return;
        
        const type = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
        const obstacle = {
            x: Math.random() * (this.width - type.width),
            y: -type.height,
            width: type.width,
            height: type.height,
            color: type.color,
            points: type.points
        };
        
        this.obstacles.push(obstacle);
        
        // Agendar próximo obstáculo
        setTimeout(() => this.spawnObstacle(), 2000);
    }

    update() {
        if (this.gameOver) return;
        
        // Mover carro
        if (this.keys.left && this.car.x > 0) {
            this.car.x -= this.car.speed;
        }
        if (this.keys.right && this.car.x < this.width - this.car.width) {
            this.car.x += this.car.speed;
        }
        
        // Atualizar obstáculos
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.y += this.speed;
            
            // Verificar colisão
            if (this.checkCollision(this.car, obstacle)) {
                this.gameOver = true;
                clearInterval(this.gameLoop);
                if (this.score >= this.targetScore) {
                    this.onComplete(true);
                } else {
                    this.onComplete(false);
                }
                return;
            }
            
            // Remover obstáculos que saíram da tela e adicionar pontos
            if (obstacle.y > this.height) {
                this.score += obstacle.points;
                this.obstacles.splice(i, 1);
                
                // Aumentar velocidade gradualmente
                if (this.score % 100 === 0) {
                    this.speed += 0.5;
                }
            }
        }
        
        this.draw();
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    draw() {
        // Limpar canvas
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Desenhar faixas da estrada
        this.ctx.fillStyle = '#fff';
        for (let y = 0; y < this.height; y += 40) {
            this.ctx.fillRect(this.width / 2 - 2, y, 4, 20);
        }
        
        // Desenhar carro
        this.ctx.fillStyle = '#0f0';
        this.ctx.fillRect(
            this.car.x,
            this.car.y,
            this.car.width,
            this.car.height
        );
        
        // Desenhar obstáculos
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(
                obstacle.x,
                obstacle.y,
                obstacle.width,
                obstacle.height
            );
        });
        
        // Desenhar pontuação
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`Target: ${this.targetScore}`, 10, 60);
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
            }
        });
    }

    stop() {
        clearInterval(this.gameLoop);
        this.gameOver = true;
    }
}
