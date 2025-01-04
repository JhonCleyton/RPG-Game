class ParticleSystem {
    constructor(game) {
        this.game = game;
        this.particles = new Set();
        this.emitters = new Map();
        
        // Carregar emissores predefinidos
        this.loadEmitters();
    }

    loadEmitters() {
        // Carregar configurações de emissores
        EmitterDatabase.forEach((config, id) => {
            this.emitters.set(id, new ParticleEmitter(config));
        });
    }

    createEmitter(config) {
        return new ParticleEmitter(config);
    }

    emit(emitterId, position, options = {}) {
        const emitter = this.emitters.get(emitterId);
        if (!emitter) return;
        
        // Criar partículas
        const particles = emitter.emit(position, options);
        particles.forEach(particle => this.particles.add(particle));
    }

    update(deltaTime) {
        // Atualizar partículas
        this.particles.forEach(particle => {
            particle.update(deltaTime);
            
            // Remover partículas mortas
            if (particle.isDead()) {
                this.particles.delete(particle);
            }
        });
    }

    draw(ctx) {
        this.particles.forEach(particle => {
            particle.draw(ctx);
        });
    }

    clear() {
        this.particles.clear();
    }
}

class ParticleEmitter {
    constructor(config) {
        this.config = {
            // Quantidade de partículas
            count: config.count || 1,
            spread: config.spread || 0,
            
            // Propriedades das partículas
            size: config.size || { min: 2, max: 4 },
            speed: config.speed || { min: 50, max: 100 },
            angle: config.angle || { min: 0, max: 360 },
            life: config.life || { min: 0.5, max: 1.5 },
            
            // Cores e alpha
            colors: config.colors || ['#ff0000'],
            alpha: config.alpha || { start: 1, end: 0 },
            
            // Física
            gravity: config.gravity || 0,
            friction: config.friction || 0,
            
            // Comportamento
            behavior: config.behavior || 'normal',
            
            // Forma
            shape: config.shape || 'circle',
            
            // Efeitos
            effects: config.effects || {}
        };
    }

    emit(position, options = {}) {
        const particles = [];
        const count = options.count || this.config.count;
        
        for (let i = 0; i < count; i++) {
            // Criar partícula com propriedades aleatórias
            const particle = this.createParticle(position, options);
            particles.push(particle);
        }
        
        return particles;
    }

    createParticle(position, options) {
        // Posição inicial
        const spread = options.spread || this.config.spread;
        const x = position.x + (Math.random() - 0.5) * spread;
        const y = position.y + (Math.random() - 0.5) * spread;
        
        // Tamanho
        const size = this.randomRange(this.config.size);
        
        // Velocidade e direção
        const speed = this.randomRange(this.config.speed);
        const angle = this.randomRange(this.config.angle) * Math.PI / 180;
        const velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        
        // Tempo de vida
        const life = this.randomRange(this.config.life);
        
        // Cor
        const color = this.config.colors[
            Math.floor(Math.random() * this.config.colors.length)
        ];
        
        return new Particle({
            x, y,
            size,
            velocity,
            life,
            color,
            alpha: { ...this.config.alpha },
            gravity: this.config.gravity,
            friction: this.config.friction,
            behavior: this.config.behavior,
            shape: this.config.shape,
            effects: { ...this.config.effects }
        });
    }

    randomRange(range) {
        if (typeof range === 'number') return range;
        return range.min + Math.random() * (range.max - range.min);
    }
}

class Particle {
    constructor(config) {
        // Posição
        this.x = config.x;
        this.y = config.y;
        
        // Física
        this.velocity = config.velocity;
        this.gravity = config.gravity;
        this.friction = config.friction;
        
        // Aparência
        this.size = config.size;
        this.color = config.color;
        this.alpha = config.alpha;
        this.shape = config.shape;
        
        // Tempo de vida
        this.life = config.life;
        this.maxLife = config.life;
        
        // Comportamento
        this.behavior = config.behavior;
        
        // Efeitos
        this.effects = config.effects;
        this.initEffects();
    }

    initEffects() {
        Object.entries(this.effects).forEach(([key, effect]) => {
            if (typeof effect.current === 'undefined') {
                effect.current = effect.start;
                effect.delta = (effect.end - effect.start) / (this.maxLife * 1000);
            }
        });
    }

    update(deltaTime) {
        // Atualizar tempo de vida
        this.life -= deltaTime / 1000;
        
        // Atualizar física
        this.updatePhysics(deltaTime);
        
        // Atualizar efeitos
        this.updateEffects(deltaTime);
        
        // Atualizar comportamento específico
        this.updateBehavior(deltaTime);
    }

    updatePhysics(deltaTime) {
        // Aplicar gravidade
        this.velocity.y += this.gravity * deltaTime / 1000;
        
        // Aplicar fricção
        this.velocity.x *= (1 - this.friction * deltaTime / 1000);
        this.velocity.y *= (1 - this.friction * deltaTime / 1000);
        
        // Atualizar posição
        this.x += this.velocity.x * deltaTime / 1000;
        this.y += this.velocity.y * deltaTime / 1000;
    }

    updateEffects(deltaTime) {
        // Atualizar alpha
        if (this.alpha) {
            const progress = 1 - (this.life / this.maxLife);
            this.alpha.current = this.alpha.start + 
                (this.alpha.end - this.alpha.start) * progress;
        }
        
        // Atualizar outros efeitos
        Object.values(this.effects).forEach(effect => {
            effect.current += effect.delta * deltaTime;
        });
    }

    updateBehavior(deltaTime) {
        switch (this.behavior) {
            case 'spiral':
                this.updateSpiralBehavior(deltaTime);
                break;
            case 'wave':
                this.updateWaveBehavior(deltaTime);
                break;
            case 'attract':
                this.updateAttractBehavior(deltaTime);
                break;
        }
    }

    updateSpiralBehavior(deltaTime) {
        const angle = (this.maxLife - this.life) * 5;
        const radius = 50 * (this.life / this.maxLife);
        
        this.velocity.x = Math.cos(angle) * radius - this.x;
        this.velocity.y = Math.sin(angle) * radius - this.y;
    }

    updateWaveBehavior(deltaTime) {
        const frequency = 5;
        const amplitude = 20;
        
        this.velocity.y = Math.sin((this.maxLife - this.life) * frequency) * 
            amplitude * deltaTime / 1000;
    }

    updateAttractBehavior(deltaTime) {
        const target = { x: 0, y: 0 };
        const strength = 500;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.velocity.x += (dx / distance) * strength * deltaTime / 1000;
            this.velocity.y += (dy / distance) * strength * deltaTime / 1000;
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Aplicar alpha
        ctx.globalAlpha = this.alpha.current;
        
        // Aplicar cor
        ctx.fillStyle = this.color;
        
        // Desenhar forma
        switch (this.shape) {
            case 'circle':
                this.drawCircle(ctx);
                break;
            case 'square':
                this.drawSquare(ctx);
                break;
            case 'star':
                this.drawStar(ctx);
                break;
        }
        
        ctx.restore();
    }

    drawCircle(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSquare(ctx) {
        ctx.fillRect(
            this.x - this.size / 2,
            this.y - this.size / 2,
            this.size,
            this.size
        );
    }

    drawStar(ctx) {
        const spikes = 5;
        const outerRadius = this.size / 2;
        const innerRadius = outerRadius / 2;
        
        ctx.beginPath();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.PI / 2);
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * i) / spikes;
            
            if (i === 0) {
                ctx.moveTo(radius, 0);
            } else {
                ctx.lineTo(
                    radius * Math.cos(angle),
                    radius * Math.sin(angle)
                );
            }
        }
        
        ctx.closePath();
        ctx.fill();
    }

    isDead() {
        return this.life <= 0;
    }
}

// Banco de Dados de Emissores
const EmitterDatabase = new Map([
    ['hit_impact', {
        count: 10,
        spread: 20,
        size: { min: 3, max: 8 },
        speed: { min: 100, max: 200 },
        angle: { min: 0, max: 360 },
        life: { min: 0.3, max: 0.6 },
        colors: ['#ff0000', '#ff6666'],
        alpha: { start: 1, end: 0 },
        gravity: 300,
        friction: 0.5
    }],
    
    ['heal_effect', {
        count: 15,
        spread: 30,
        size: { min: 4, max: 8 },
        speed: { min: 50, max: 100 },
        angle: { min: -90, max: -270 },
        life: { min: 0.8, max: 1.2 },
        colors: ['#00ff00', '#66ff66'],
        alpha: { start: 1, end: 0 },
        gravity: -100,
        behavior: 'spiral'
    }],
    
    ['level_up', {
        count: 30,
        spread: 50,
        size: { min: 5, max: 10 },
        speed: { min: 150, max: 300 },
        angle: { min: 0, max: 360 },
        life: { min: 1, max: 1.5 },
        colors: ['#ffff00', '#ffdd00', '#ffd700'],
        alpha: { start: 1, end: 0 },
        gravity: -50,
        behavior: 'wave',
        shape: 'star'
    }]
]);
