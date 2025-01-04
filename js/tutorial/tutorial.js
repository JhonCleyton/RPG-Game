class TutorialSystem {
    constructor(game) {
        this.game = game;
        this.currentStep = 0;
        this.active = false;
        this.highlightedElement = null;
        this.tooltipPosition = { x: 0, y: 0 };
        
        // Elementos do tutorial
        this.tooltipElement = this.createTooltip();
        
        // Overlay para destacar elementos
        this.overlay = this.createOverlay();
    }

    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'tutorial-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: linear-gradient(to bottom, #8b4513, #654321);
            border: 3px solid #daa520;
            border-radius: 10px;
            padding: 20px;
            max-width: 300px;
            color: #fff;
            font-family: 'MedievalFont', serif;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 1000;
            pointer-events: none;
        `;
        document.body.appendChild(tooltip);
        return tooltip;
    }

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'tutorial-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 999;
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    start() {
        this.active = true;
        this.currentStep = 0;
        this.showCurrentStep();
    }

    showCurrentStep() {
        if (!this.active || this.currentStep >= TutorialSteps.length) {
            this.end();
            return;
        }

        const step = TutorialSteps[this.currentStep];
        
        // Atualizar tooltip
        this.tooltipElement.innerHTML = `
            <h3>${step.title}</h3>
            <p>${step.description}</p>
            ${step.action ? '<div class="tutorial-action">' + step.action + '</div>' : ''}
            <div class="tutorial-progress">
                Passo ${this.currentStep + 1} de ${TutorialSteps.length}
            </div>
        `;

        // Posicionar e mostrar tooltip
        if (step.element) {
            const element = document.querySelector(step.element);
            if (element) {
                this.highlightElement(element);
                this.positionTooltip(element, step.position);
            }
        } else {
            this.centerTooltip();
        }

        // Mostrar overlay
        this.overlay.style.opacity = '1';
        this.tooltipElement.style.opacity = '1';

        // Configurar trigger para próximo passo
        if (step.trigger) {
            this.setupTrigger(step.trigger);
        } else {
            // Avançar automaticamente após delay
            setTimeout(() => this.nextStep(), step.delay || 3000);
        }
    }

    highlightElement(element) {
        const rect = element.getBoundingClientRect();
        this.overlay.innerHTML = `
            <div class="highlight" style="
                position: absolute;
                top: ${rect.top}px;
                left: ${rect.left}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                border: 2px solid #daa520;
                border-radius: 5px;
                box-shadow: 0 0 20px #daa520;
                pointer-events: none;
            "></div>
        `;
    }

    positionTooltip(element, position = 'bottom') {
        const rect = element.getBoundingClientRect();
        const tooltipRect = this.tooltipElement.getBoundingClientRect();
        
        let x, y;
        
        switch(position) {
            case 'top':
                x = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                y = rect.top - tooltipRect.height - 10;
                break;
            case 'bottom':
                x = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                y = rect.bottom + 10;
                break;
            case 'left':
                x = rect.left - tooltipRect.width - 10;
                y = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                break;
            case 'right':
                x = rect.right + 10;
                y = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                break;
        }

        this.tooltipElement.style.transform = `translate(${x}px, ${y}px)`;
    }

    centerTooltip() {
        const tooltipRect = this.tooltipElement.getBoundingClientRect();
        const x = (window.innerWidth / 2) - (tooltipRect.width / 2);
        const y = (window.innerHeight / 2) - (tooltipRect.height / 2);
        this.tooltipElement.style.transform = `translate(${x}px, ${y}px)`;
    }

    setupTrigger(trigger) {
        switch(trigger.type) {
            case 'key':
                const keyHandler = (e) => {
                    if (e.key === trigger.key) {
                        document.removeEventListener('keydown', keyHandler);
                        this.nextStep();
                    }
                };
                document.addEventListener('keydown', keyHandler);
                break;
            case 'click':
                const element = document.querySelector(trigger.element);
                if (element) {
                    const clickHandler = () => {
                        element.removeEventListener('click', clickHandler);
                        this.nextStep();
                    };
                    element.addEventListener('click', clickHandler);
                }
                break;
            case 'action':
                const actionCheck = setInterval(() => {
                    if (trigger.condition()) {
                        clearInterval(actionCheck);
                        this.nextStep();
                    }
                }, 100);
                break;
        }
    }

    nextStep() {
        this.currentStep++;
        this.showCurrentStep();
    }

    end() {
        this.active = false;
        this.tooltipElement.style.opacity = '0';
        this.overlay.style.opacity = '0';
        this.game.onTutorialComplete();
    }
}

const TutorialSteps = [
    {
        title: "Bem-vindo à sua Jornada!",
        description: "Em um reino distante, onde magia e mistério se entrelaçam, você foi escolhido para uma missão épica. Vamos aprender como se tornar um verdadeiro herói!",
        delay: 5000
    },
    {
        title: "Movimentação Básica",
        description: "Use as teclas WASD ou as setas do teclado para mover seu personagem pelo mundo.",
        action: "Pressione qualquer tecla de movimento para continuar",
        trigger: {
            type: 'key',
            key: ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
        }
    },
    {
        title: "Interação com o Mundo",
        description: "Pressione E para interagir com objetos e NPCs. Tente falar com o Velho Sábio próximo a você.",
        element: '#npc-sage',
        position: 'right',
        trigger: {
            type: 'key',
            key: 'e'
        }
    },
    {
        title: "Combate Básico",
        description: "Clique com o botão esquerdo do mouse para atacar. Mantenha distância de inimigos perigosos!",
        action: "Tente atacar o boneco de treino",
        trigger: {
            type: 'click',
            element: '#training-dummy'
        }
    },
    {
        title: "Inventário",
        description: "Pressione I para abrir seu inventário. Aqui você pode equipar itens e usar poções.",
        element: '#inventory-button',
        position: 'left',
        trigger: {
            type: 'key',
            key: 'i'
        }
    },
    {
        title: "Habilidades",
        description: "Cada classe tem habilidades únicas. Pressione 1-4 para usar suas habilidades em combate.",
        element: '#skills-bar',
        position: 'top',
        trigger: {
            type: 'key',
            key: ['1', '2', '3', '4']
        }
    },
    {
        title: "Quests",
        description: "Fale com NPCs marcados com ! para aceitar missões. Complete-as para ganhar experiência e recompensas.",
        element: '#quest-log',
        position: 'right',
        trigger: {
            type: 'action',
            condition: () => game.player.hasActiveQuest
        }
    },
    {
        title: "Pronto para a Aventura!",
        description: "Você aprendeu o básico! Agora é hora de explorar o mundo, completar missões e se tornar uma lenda!",
        delay: 5000
    }
];
