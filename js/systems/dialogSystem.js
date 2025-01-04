class DialogSystem {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.currentDialog = null;
        this.currentOptions = null;
        this.textSpeed = 30; // ms por caractere
        this.currentTextIndex = 0;
        this.currentCharIndex = 0;
        this.textBuffer = '';
        
        // Criar elementos da UI
        this.createDialogUI();
        
        // Registrar eventos
        this.setupEventListeners();
    }

    createDialogUI() {
        // Container principal
        this.container = document.createElement('div');
        this.container.className = 'dialog-container';
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            max-width: 800px;
            background: linear-gradient(to bottom, #2c1810, #1a0f0a);
            border: 5px solid #c0a080;
            border-radius: 15px;
            padding: 20px;
            display: none;
            z-index: 1000;
        `;

        // Nome do NPC
        this.nameBox = document.createElement('div');
        this.nameBox.className = 'dialog-name';
        this.nameBox.style.cssText = `
            position: absolute;
            top: -30px;
            left: 20px;
            background: #2c1810;
            border: 3px solid #c0a080;
            border-radius: 8px;
            padding: 5px 15px;
            color: #daa520;
            font-family: 'MedievalFont', serif;
            font-size: 18px;
        `;

        // Texto do diálogo
        this.textBox = document.createElement('div');
        this.textBox.className = 'dialog-text';
        this.textBox.style.cssText = `
            color: #e8d5b5;
            font-family: 'MedievalFont', serif;
            font-size: 20px;
            line-height: 1.5;
            margin-bottom: 15px;
            min-height: 60px;
        `;

        // Container de opções
        this.optionsContainer = document.createElement('div');
        this.optionsContainer.className = 'dialog-options';
        this.optionsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        // Indicador de continuar
        this.continueIndicator = document.createElement('div');
        this.continueIndicator.className = 'dialog-continue';
        this.continueIndicator.innerHTML = '▼';
        this.continueIndicator.style.cssText = `
            position: absolute;
            bottom: 5px;
            right: 20px;
            color: #daa520;
            font-size: 24px;
            animation: bounce 0.5s infinite alternate;
        `;

        // Adicionar elementos ao container
        this.container.appendChild(this.nameBox);
        this.container.appendChild(this.textBox);
        this.container.appendChild(this.optionsContainer);
        this.container.appendChild(this.continueIndicator);
        document.body.appendChild(this.container);

        // Adicionar estilo de animação
        const style = document.createElement('style');
        style.textContent = `
            @keyframes bounce {
                from { transform: translateY(0); }
                to { transform: translateY(-5px); }
            }
            
            .dialog-option {
                background: linear-gradient(to bottom, #8b4513, #654321);
                border: 2px solid #daa520;
                border-radius: 5px;
                padding: 10px 15px;
                color: #fff;
                font-family: 'MedievalFont', serif;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .dialog-option:hover {
                transform: scale(1.02);
                box-shadow: 0 0 10px #daa520;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Evento de clique para avançar diálogo
        this.container.addEventListener('click', () => {
            if (this.isTextFullyTyped()) {
                if (this.currentOptions) {
                    // Esperar seleção de opção
                    return;
                }
                this.advance();
            } else {
                this.completeCurrentText();
            }
        });

        // Tecla para avançar diálogo
        document.addEventListener('keydown', (e) => {
            if (!this.active) return;
            
            if (e.key === 'Enter' || e.key === 'Space') {
                e.preventDefault();
                if (this.isTextFullyTyped()) {
                    if (!this.currentOptions) {
                        this.advance();
                    }
                } else {
                    this.completeCurrentText();
                }
            }
        });
    }

    startDialog(dialog) {
        this.currentDialog = dialog;
        this.currentTextIndex = 0;
        this.active = true;
        this.container.style.display = 'block';
        this.showCurrentText();
        
        // Pausar o jogo
        this.game.pauseGame();
    }

    showCurrentText() {
        if (!this.currentDialog || this.currentTextIndex >= this.currentDialog.length) {
            this.endDialog();
            return;
        }

        const currentPart = this.currentDialog[this.currentTextIndex];
        
        // Mostrar nome do NPC
        this.nameBox.textContent = currentPart.speaker || '';
        
        // Iniciar animação de texto
        this.currentCharIndex = 0;
        this.textBuffer = '';
        this.textBox.textContent = '';
        this.typeText(currentPart.text);
        
        // Configurar opções se existirem
        if (currentPart.options) {
            this.showOptions(currentPart.options);
        } else {
            this.currentOptions = null;
            this.optionsContainer.innerHTML = '';
        }
    }

    typeText(text) {
        if (this.currentCharIndex < text.length) {
            this.textBuffer += text[this.currentCharIndex];
            this.textBox.textContent = this.textBuffer;
            this.currentCharIndex++;
            
            // Tocar som de digitação
            if (text[this.currentCharIndex - 1] !== ' ') {
                this.game.soundSystem.playSound('text_type', { volume: 0.3 });
            }
            
            setTimeout(() => this.typeText(text), this.textSpeed);
        }
    }

    showOptions(options) {
        this.currentOptions = options;
        this.optionsContainer.innerHTML = '';
        
        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'dialog-option';
            button.textContent = option.text;
            
            button.onclick = (e) => {
                e.stopPropagation();
                this.selectOption(index);
            };
            
            this.optionsContainer.appendChild(button);
        });
    }

    selectOption(index) {
        const option = this.currentOptions[index];
        if (option.onSelect) {
            option.onSelect();
        }
        
        if (option.next) {
            this.currentTextIndex = option.next;
        } else {
            this.currentTextIndex++;
        }
        
        this.currentOptions = null;
        this.showCurrentText();
    }

    advance() {
        if (!this.active || this.currentOptions) return;
        
        this.currentTextIndex++;
        this.showCurrentText();
    }

    endDialog() {
        this.active = false;
        this.currentDialog = null;
        this.container.style.display = 'none';
        
        // Retomar o jogo
        this.game.resumeGame();
    }

    isTextFullyTyped() {
        if (!this.currentDialog) return true;
        const currentText = this.currentDialog[this.currentTextIndex].text;
        return this.currentCharIndex >= currentText.length;
    }

    completeCurrentText() {
        if (!this.currentDialog) return;
        
        const currentText = this.currentDialog[this.currentTextIndex].text;
        this.textBuffer = currentText;
        this.textBox.textContent = currentText;
        this.currentCharIndex = currentText.length;
    }

    // Funções de utilidade para criar diálogos
    static createDialog(speaker, text) {
        return { speaker, text };
    }

    static createOption(text, onSelect, next = null) {
        return { text, onSelect, next };
    }

    static createBranch(speaker, text, options) {
        return { speaker, text, options };
    }
}
