class AnimationSystem {
    constructor(game) {
        this.game = game;
        this.animations = new Map();
        this.activeAnimations = new Set();
        
        // Carregar animações
        this.loadAnimations();
    }

    loadAnimations() {
        // Carregar dados de animação
        AnimationDatabase.forEach((animData, animId) => {
            this.animations.set(animId, new Animation(animData));
        });
    }

    play(animationId, target, options = {}) {
        const animation = this.animations.get(animationId);
        if (!animation) return null;
        
        // Criar instância da animação
        const instance = animation.createInstance(target, options);
        this.activeAnimations.add(instance);
        
        return instance;
    }

    update(deltaTime) {
        // Atualizar todas as animações ativas
        this.activeAnimations.forEach(animation => {
            animation.update(deltaTime);
            
            // Remover animações concluídas
            if (animation.isComplete()) {
                this.activeAnimations.delete(animation);
            }
        });
    }

    stopAll() {
        this.activeAnimations.clear();
    }
}

class Animation {
    constructor(data) {
        this.id = data.id;
        this.frames = data.frames;
        this.frameDuration = data.frameDuration || 100;
        this.loop = data.loop || false;
        this.spritesheet = data.spritesheet;
        
        // Carregar spritesheet
        this.image = new Image();
        this.image.src = this.spritesheet;
        
        // Dimensões
        this.frameWidth = data.frameWidth;
        this.frameHeight = data.frameHeight;
        
        // Efeitos
        this.effects = data.effects || {};
    }

    createInstance(target, options = {}) {
        return new AnimationInstance(this, target, options);
    }
}

class AnimationInstance {
    constructor(animation, target, options) {
        this.animation = animation;
        this.target = target;
        this.options = options;
        
        // Estado da animação
        this.currentFrame = 0;
        this.frameTime = 0;
        this.complete = false;
        
        // Transformações
        this.scale = options.scale || 1;
        this.rotation = options.rotation || 0;
        this.alpha = options.alpha || 1;
        
        // Offset da posição
        this.offsetX = options.offsetX || 0;
        this.offsetY = options.offsetY || 0;
        
        // Efeitos
        this.initEffects();
    }

    initEffects() {
        this.effects = {};
        
        // Copiar efeitos da animação
        Object.entries(this.animation.effects).forEach(([key, effect]) => {
            this.effects[key] = {
                ...effect,
                current: effect.start,
                delta: (effect.end - effect.start) / this.animation.frames.length
            };
        });
    }

    update(deltaTime) {
        if (this.complete) return;
        
        // Atualizar tempo do frame
        this.frameTime += deltaTime;
        
        // Avançar frame se necessário
        while (this.frameTime >= this.animation.frameDuration) {
            this.frameTime -= this.animation.frameDuration;
            this.advance();
        }
        
        // Atualizar efeitos
        this.updateEffects();
    }

    advance() {
        this.currentFrame++;
        
        // Verificar fim da animação
        if (this.currentFrame >= this.animation.frames.length) {
            if (this.animation.loop) {
                this.currentFrame = 0;
            } else {
                this.complete = true;
                this.currentFrame = this.animation.frames.length - 1;
            }
        }
    }

    updateEffects() {
        Object.values(this.effects).forEach(effect => {
            effect.current += effect.delta;
        });
    }

    draw(ctx) {
        if (!this.animation.image.complete) return;
        
        const frame = this.animation.frames[this.currentFrame];
        const effects = this.effects;
        
        // Salvar contexto
        ctx.save();
        
        // Aplicar transformações
        ctx.translate(
            this.target.x + this.offsetX,
            this.target.y + this.offsetY
        );
        
        // Rotação
        if (this.rotation || effects.rotation) {
            ctx.rotate((this.rotation + (effects.rotation?.current || 0)) * Math.PI / 180);
        }
        
        // Escala
        const scaleX = this.scale * (effects.scale?.current || 1);
        const scaleY = this.scale * (effects.scale?.current || 1);
        ctx.scale(scaleX, scaleY);
        
        // Alpha
        ctx.globalAlpha = this.alpha * (effects.alpha?.current || 1);
        
        // Desenhar frame
        ctx.drawImage(
            this.animation.image,
            frame.x, frame.y,
            this.animation.frameWidth,
            this.animation.frameHeight,
            -this.animation.frameWidth / 2,
            -this.animation.frameHeight / 2,
            this.animation.frameWidth,
            this.animation.frameHeight
        );
        
        // Restaurar contexto
        ctx.restore();
    }

    isComplete() {
        return this.complete;
    }
}

// Banco de Dados de Animações
const AnimationDatabase = new Map([
    ['player_idle', {
        id: 'player_idle',
        spritesheet: 'assets/sprites/player.png',
        frameWidth: 32,
        frameHeight: 48,
        frameDuration: 150,
        loop: true,
        frames: [
            { x: 0, y: 0 },
            { x: 32, y: 0 },
            { x: 64, y: 0 },
            { x: 96, y: 0 }
        ]
    }],
    
    ['player_walk', {
        id: 'player_walk',
        spritesheet: 'assets/sprites/player.png',
        frameWidth: 32,
        frameHeight: 48,
        frameDuration: 100,
        loop: true,
        frames: [
            { x: 0, y: 48 },
            { x: 32, y: 48 },
            { x: 64, y: 48 },
            { x: 96, y: 48 },
            { x: 128, y: 48 },
            { x: 160, y: 48 }
        ]
    }],
    
    ['attack_slash', {
        id: 'attack_slash',
        spritesheet: 'assets/effects/slash.png',
        frameWidth: 64,
        frameHeight: 64,
        frameDuration: 50,
        loop: false,
        frames: [
            { x: 0, y: 0 },
            { x: 64, y: 0 },
            { x: 128, y: 0 },
            { x: 192, y: 0 },
            { x: 256, y: 0 }
        ],
        effects: {
            scale: { start: 0.8, end: 1.2 },
            alpha: { start: 1, end: 0 }
        }
    }]
]);
