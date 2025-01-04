class LogicPuzzle {
    constructor(canvas, callback) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onComplete = callback;
        
        // Configurações do jogo
        this.width = 800;
        this.height = 600;
        this.currentPuzzle = null;
        this.timeLimit = 120; // segundos
        this.timeRemaining = this.timeLimit;
        this.solved = false;
        
        // Ajustar tamanho do canvas
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.setupControls();
        this.timer = null;
    }

    start() {
        this.currentPuzzle = this.getRandomPuzzle();
        this.timeRemaining = this.timeLimit;
        this.timer = setInterval(() => this.updateTimer(), 1000);
        this.draw();
    }

    updateTimer() {
        this.timeRemaining--;
        if (this.timeRemaining <= 0) {
            clearInterval(this.timer);
            this.onComplete(false);
        }
        this.draw();
    }

    getRandomPuzzle() {
        return LogicPuzzles[Math.floor(Math.random() * LogicPuzzles.length)];
    }

    checkAnswer(answer) {
        if (!this.currentPuzzle) return false;
        
        const isCorrect = this.currentPuzzle.checkAnswer(answer);
        if (isCorrect) {
            clearInterval(this.timer);
            this.solved = true;
            this.onComplete(true);
        }
        return isCorrect;
    }

    draw() {
        // Limpar canvas
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (!this.currentPuzzle) return;
        
        // Desenhar puzzle
        this.ctx.fillStyle = '#000';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        
        // Título
        this.ctx.fillText(this.currentPuzzle.title, this.width / 2, 50);
        
        // Descrição do puzzle
        this.ctx.font = '18px Arial';
        const lines = this.wrapText(this.currentPuzzle.description, this.width - 100);
        lines.forEach((line, index) => {
            this.ctx.fillText(line, this.width / 2, 100 + (index * 30));
        });
        
        // Desenhar timer
        this.ctx.fillStyle = this.timeRemaining < 30 ? '#f00' : '#000';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(
            `Time: ${Math.floor(this.timeRemaining / 60)}:${(this.timeRemaining % 60).toString().padStart(2, '0')}`,
            this.width - 20,
            30
        );
        
        // Desenhar interface específica do puzzle
        this.currentPuzzle.draw(this.ctx, this.width, this.height);
    }

    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = this.ctx.measureText(currentLine + " " + word).width;
            
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    setupControls() {
        this.canvas.addEventListener('click', (e) => {
            if (this.currentPuzzle && this.currentPuzzle.handleClick) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.currentPuzzle.handleClick(x, y);
                this.draw();
            }
        });
    }

    stop() {
        clearInterval(this.timer);
    }
}

// Definição dos Puzzles Lógicos
const LogicPuzzles = [
    // Puzzle 1: Sequência Numérica
    {
        title: "Sequência Numérica",
        description: "Qual é o próximo número na sequência: 2, 6, 12, 20, ?",
        answer: 30,
        hint: "Observe a diferença entre os números consecutivos",
        checkAnswer: function(answer) {
            return parseInt(answer) === this.answer;
        },
        draw: function(ctx, width, height) {
            ctx.font = '36px Arial';
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.fillText("2, 6, 12, 20, __", width/2, height/2);
            
            // Desenhar campo de entrada
            ctx.strokeRect(width/2 - 50, height/2 + 50, 100, 40);
        }
    },
    
    // Puzzle 2: Padrão Visual
    {
        title: "Padrão Visual",
        description: "Selecione a próxima figura que completa o padrão:",
        patterns: [
            {x: 100, y: 200, type: 'circle'},
            {x: 200, y: 200, type: 'square'},
            {x: 300, y: 200, type: 'circle'},
            {x: 400, y: 200, type: 'square'}
        ],
        options: [
            {x: 200, y: 400, type: 'circle', correct: true},
            {x: 400, y: 400, type: 'square', correct: false},
            {x: 600, y: 400, type: 'triangle', correct: false}
        ],
        selected: null,
        checkAnswer: function(answer) {
            return answer.correct;
        },
        handleClick: function(x, y) {
            this.options.forEach(option => {
                if (Math.abs(x - option.x) < 30 && Math.abs(y - option.y) < 30) {
                    this.selected = option;
                    if (option.correct) {
                        return true;
                    }
                }
            });
            return false;
        },
        draw: function(ctx, width, height) {
            // Desenhar padrão
            this.patterns.forEach(pattern => {
                if (pattern.type === 'circle') {
                    ctx.beginPath();
                    ctx.arc(pattern.x, pattern.y, 20, 0, Math.PI * 2);
                    ctx.stroke();
                } else if (pattern.type === 'square') {
                    ctx.strokeRect(pattern.x - 20, pattern.y - 20, 40, 40);
                }
            });
            
            // Desenhar opções
            this.options.forEach(option => {
                ctx.beginPath();
                if (option === this.selected) {
                    ctx.fillStyle = '#0f0';
                } else {
                    ctx.fillStyle = '#fff';
                }
                
                if (option.type === 'circle') {
                    ctx.arc(option.x, option.y, 20, 0, Math.PI * 2);
                } else if (option.type === 'square') {
                    ctx.rect(option.x - 20, option.y - 20, 40, 40);
                } else if (option.type === 'triangle') {
                    ctx.moveTo(option.x, option.y - 20);
                    ctx.lineTo(option.x + 20, option.y + 20);
                    ctx.lineTo(option.x - 20, option.y + 20);
                    ctx.closePath();
                }
                ctx.fill();
                ctx.stroke();
            });
        }
    },
    
    // Puzzle 3: Problema Lógico
    {
        title: "Problema Lógico",
        description: "Ana é mais alta que Maria, mas mais baixa que Júlia. Carol é mais baixa que Maria. Quem é a mais alta?",
        options: [
            {text: "Ana", correct: false},
            {text: "Maria", correct: false},
            {text: "Júlia", correct: true},
            {text: "Carol", correct: false}
        ],
        selected: null,
        checkAnswer: function(answer) {
            return answer.correct;
        },
        handleClick: function(x, y) {
            const buttonHeight = 40;
            const buttonWidth = 200;
            const startY = 300;
            
            this.options.forEach((option, index) => {
                const buttonY = startY + (index * (buttonHeight + 10));
                if (x > 300 && x < 300 + buttonWidth &&
                    y > buttonY && y < buttonY + buttonHeight) {
                    this.selected = option;
                    return option.correct;
                }
            });
            return false;
        },
        draw: function(ctx, width, height) {
            ctx.font = '20px Arial';
            ctx.textAlign = 'left';
            
            this.options.forEach((option, index) => {
                const y = 300 + (index * 50);
                
                // Desenhar botão
                ctx.fillStyle = option === this.selected ? '#0f0' : '#fff';
                ctx.fillRect(300, y, 200, 40);
                ctx.strokeRect(300, y, 200, 40);
                
                // Desenhar texto
                ctx.fillStyle = '#000';
                ctx.fillText(option.text, 320, y + 25);
            });
        }
    }
];
