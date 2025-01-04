class MainMenuScene {
    constructor(game) {
        this.game = game;
        this.buttons = [
            {
                text: 'Novo Jogo',
                action: () => this.game.startNewGame(),
                x: 0,
                y: 0,
                width: 200,
                height: 50
            },
            {
                text: 'Carregar Jogo',
                action: () => this.game.loadGame(),
                x: 0,
                y: 0,
                width: 200,
                height: 50
            },
            {
                text: 'Opções',
                action: () => this.game.setScene(new OptionsScene(this.game)),
                x: 0,
                y: 0,
                width: 200,
                height: 50
            }
        ];
        
        // Background com paralaxe
        this.backgrounds = [
            {
                image: this.game.assetLoader.getImage('menu_bg_far'),
                speed: 0.2,
                x: 0
            },
            {
                image: this.game.assetLoader.getImage('menu_bg_mid'),
                speed: 0.4,
                x: 0
            },
            {
                image: this.game.assetLoader.getImage('menu_bg_near'),
                speed: 0.6,
                x: 0
            }
        ];
        
        // Animações
        this.titleY = -50;
        this.titleTargetY = 100;
        this.buttonsOpacity = 0;
        
        // Música
        this.menuMusic = this.game.soundSystem.getSound('menu_theme');
    }

    enter() {
        // Posicionar botões
        this.updateButtonPositions();
        
        // Iniciar animações
        this.startAnimations();
        
        // Tocar música
        this.menuMusic.play({ loop: true });
        
        // Adicionar event listeners
        this.addEventListeners();
    }

    exit() {
        // Parar música
        this.menuMusic.stop();
        
        // Remover event listeners
        this.removeEventListeners();
    }

    update(deltaTime) {
        // Atualizar paralaxe
        this.updateParallax(deltaTime);
        
        // Atualizar animações
        this.updateAnimations(deltaTime);
    }

    render(ctx) {
        // Renderizar backgrounds
        this.renderBackgrounds(ctx);
        
        // Renderizar título
        this.renderTitle(ctx);
        
        // Renderizar botões
        this.renderButtons(ctx);
    }

    updateButtonPositions() {
        const centerX = this.game.canvas.width / 2;
        const startY = 300;
        const spacing = 70;
        
        this.buttons.forEach((button, index) => {
            button.x = centerX - button.width / 2;
            button.y = startY + (spacing * index);
        });
    }

    startAnimations() {
        // Animação do título
        this.titleY = -50;
        this.buttonsOpacity = 0;
        
        // Fade in dos botões
        setTimeout(() => {
            const fadeIn = setInterval(() => {
                this.buttonsOpacity += 0.05;
                if (this.buttonsOpacity >= 1) {
                    clearInterval(fadeIn);
                }
            }, 50);
        }, 1000);
    }

    updateParallax(deltaTime) {
        this.backgrounds.forEach(bg => {
            bg.x -= bg.speed * deltaTime;
            if (bg.x <= -bg.image.width) {
                bg.x = 0;
            }
        });
    }

    updateAnimations(deltaTime) {
        // Animação suave do título
        if (this.titleY < this.titleTargetY) {
            this.titleY += (this.titleTargetY - this.titleY) * 0.05;
        }
    }

    renderBackgrounds(ctx) {
        this.backgrounds.forEach(bg => {
            // Renderizar duas vezes para scroll infinito
            ctx.drawImage(bg.image, bg.x, 0);
            ctx.drawImage(bg.image, bg.x + bg.image.width, 0);
        });
    }

    renderTitle(ctx) {
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 10;
        ctx.font = '60px MedievalFont';
        ctx.textAlign = 'center';
        ctx.fillText('Eldoria', this.game.canvas.width / 2, this.titleY);
        ctx.restore();
    }

    renderButtons(ctx) {
        ctx.save();
        ctx.globalAlpha = this.buttonsOpacity;
        
        this.buttons.forEach(button => {
            // Fundo do botão
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(button.x, button.y, button.width, button.height);
            
            // Borda do botão
            ctx.strokeStyle = '#daa520';
            ctx.lineWidth = 2;
            ctx.strokeRect(button.x, button.y, button.width, button.height);
            
            // Texto do botão
            ctx.fillStyle = '#fff';
            ctx.font = '24px MedievalFont';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                button.text,
                button.x + button.width / 2,
                button.y + button.height / 2
            );
        });
        
        ctx.restore();
    }

    handleClick(x, y) {
        this.buttons.forEach(button => {
            if (x >= button.x && x <= button.x + button.width &&
                y >= button.y && y <= button.y + button.height) {
                // Efeito sonoro
                this.game.soundSystem.playSound('button_click');
                
                // Executar ação do botão
                button.action();
            }
        });
    }

    addEventListeners() {
        this.clickHandler = this.handleClick.bind(this);
        this.game.canvas.addEventListener('click', this.clickHandler);
    }

    removeEventListeners() {
        this.game.canvas.removeEventListener('click', this.clickHandler);
    }
}
