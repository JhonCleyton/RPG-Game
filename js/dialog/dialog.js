class DialogSystem {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.currentDialog = null;
        this.currentLine = 0;
        this.textSpeed = 30; // ms por caractere
        this.currentText = '';
        this.isTyping = false;
        this.choices = [];
        this.selectedChoice = 0;
        
        // Callbacks
        this.onDialogEnd = null;
        this.onChoiceMade = null;
    }

    startDialog(dialog, onEnd = null) {
        this.currentDialog = dialog;
        this.currentLine = 0;
        this.active = true;
        this.onDialogEnd = onEnd;
        this.game.currentState = this.game.gameStates.DIALOG;
        this.showNextLine();
    }

    showNextLine() {
        if (!this.currentDialog || this.currentLine >= this.currentDialog.lines.length) {
            this.endDialog();
            return;
        }

        const line = this.currentDialog.lines[this.currentLine];
        
        if (line.type === 'choice') {
            this.showChoices(line.choices);
        } else {
            this.typeText(line.text);
            if (line.speaker) {
                // Atualizar retrato do personagem
                this.updateSpeakerPortrait(line.speaker);
            }
        }
    }

    async typeText(text) {
        this.isTyping = true;
        this.currentText = '';
        
        for (let char of text) {
            this.currentText += char;
            await new Promise(resolve => setTimeout(resolve, this.textSpeed));
            
            // Permitir pular a digitação
            if (!this.isTyping) {
                this.currentText = text;
                break;
            }
        }
        
        this.isTyping = false;
    }

    showChoices(choices) {
        this.choices = choices;
        this.selectedChoice = 0;
    }

    handleInput(input) {
        if (!this.active) return;

        if (this.choices.length > 0) {
            // Navegação das escolhas
            if (input === 'up') {
                this.selectedChoice = (this.selectedChoice - 1 + this.choices.length) % this.choices.length;
            } else if (input === 'down') {
                this.selectedChoice = (this.selectedChoice + 1) % this.choices.length;
            } else if (input === 'action') {
                this.makeChoice(this.selectedChoice);
            }
        } else {
            // Avançar diálogo
            if (input === 'action') {
                if (this.isTyping) {
                    // Pular animação de texto
                    this.isTyping = false;
                } else {
                    this.currentLine++;
                    this.showNextLine();
                }
            }
        }
    }

    makeChoice(choiceIndex) {
        const choice = this.choices[choiceIndex];
        this.choices = [];
        
        if (this.onChoiceMade) {
            this.onChoiceMade(choice);
        }

        if (choice.nextLine) {
            this.currentLine = choice.nextLine;
        } else {
            this.currentLine++;
        }
        
        this.showNextLine();
    }

    endDialog() {
        this.active = false;
        this.currentDialog = null;
        this.game.currentState = this.game.gameStates.PLAYING;
        
        if (this.onDialogEnd) {
            this.onDialogEnd();
        }
    }

    draw(ctx) {
        if (!this.active) return;

        // Desenhar caixa de diálogo
        this.drawDialogBox(ctx);
        
        // Desenhar texto
        this.drawText(ctx);
        
        // Desenhar escolhas se houver
        if (this.choices.length > 0) {
            this.drawChoices(ctx);
        }
    }

    drawDialogBox(ctx) {
        const padding = 20;
        const boxHeight = 150;
        
        // Fundo semi-transparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(
            padding,
            this.game.canvas.height - boxHeight - padding,
            this.game.canvas.width - (padding * 2),
            boxHeight
        );
        
        // Borda
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            padding,
            this.game.canvas.height - boxHeight - padding,
            this.game.canvas.width - (padding * 2),
            boxHeight
        );
    }

    drawText(ctx) {
        const padding = 30;
        const boxHeight = 150;
        
        ctx.font = '18px Arial';
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'top';
        
        // Quebrar texto em linhas
        const maxWidth = this.game.canvas.width - (padding * 2);
        const words = this.currentText.split(' ');
        let lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);

        // Desenhar linhas
        lines.forEach((line, index) => {
            ctx.fillText(
                line,
                padding,
                this.game.canvas.height - boxHeight - padding + (index * 25) + padding
            );
        });
    }

    drawChoices(ctx) {
        const padding = 30;
        const boxHeight = 150;
        const choiceSpacing = 30;
        
        this.choices.forEach((choice, index) => {
            ctx.font = '18px Arial';
            ctx.fillStyle = index === this.selectedChoice ? '#ffff00' : '#fff';
            
            ctx.fillText(
                choice.text,
                padding + 20,
                this.game.canvas.height - boxHeight + (index * choiceSpacing) + padding
            );
            
            // Desenhar seta de seleção
            if (index === this.selectedChoice) {
                ctx.fillText(
                    '►',
                    padding,
                    this.game.canvas.height - boxHeight + (index * choiceSpacing) + padding
                );
            }
        });
    }

    updateSpeakerPortrait(speaker) {
        // Implementar mudança de retrato do personagem que está falando
    }
}

// Exemplo de diálogo
const SampleDialog = {
    lines: [
        {
            speaker: "Velho Sábio",
            text: "Ah, viajante! Vejo que você chegou em um momento crucial."
        },
        {
            speaker: "Velho Sábio",
            text: "Nossa vila está em perigo, e precisamos de ajuda."
        },
        {
            type: "choice",
            choices: [
                {
                    text: "Como posso ajudar?",
                    nextLine: 3
                },
                {
                    text: "Sinto muito, estou ocupado.",
                    nextLine: 5
                }
            ]
        },
        {
            speaker: "Velho Sábio",
            text: "Bandidos têm atacado nossa vila durante a noite. Precisamos que você os derrote!"
        },
        {
            speaker: "Velho Sábio",
            text: "Você será bem recompensado por sua ajuda.",
            nextLine: 6
        },
        {
            speaker: "Velho Sábio",
            text: "Que pena... Talvez outro herói possa nos ajudar."
        },
        {
            speaker: "Velho Sábio",
            text: "O que você decide?"
        }
    ]
};
