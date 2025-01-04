class InputSystem {
    constructor() {
        this.keys = new Map();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseButtons = new Map();
        this.gamepadState = null;
        
        // Mapeamento de teclas
        this.keyMap = {
            // Movimento
            'up': ['w', 'ArrowUp'],
            'down': ['s', 'ArrowDown'],
            'left': ['a', 'ArrowLeft'],
            'right': ['d', 'ArrowRight'],
            
            // Ações
            'interact': ['e', 'Enter'],
            'attack': ['Space'],
            'inventory': ['i'],
            'quest_log': ['q'],
            'map': ['m'],
            'pause': ['Escape'],
            
            // Habilidades
            'skill1': ['1'],
            'skill2': ['2'],
            'skill3': ['3'],
            'skill4': ['4']
        };
        
        // Configurar event listeners
        this.setupKeyboardListeners();
        this.setupMouseListeners();
        this.setupGamepadListener();
    }

    setupKeyboardListeners() {
        window.addEventListener('keydown', (event) => {
            this.keys.set(event.key, true);
            // Prevenir scroll com teclas de seta
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.key)) {
                event.preventDefault();
            }
        });

        window.addEventListener('keyup', (event) => {
            this.keys.set(event.key, false);
        });

        // Prevenir comportamentos padrão indesejados
        window.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    setupMouseListeners() {
        window.addEventListener('mousemove', (event) => {
            this.mousePosition.x = event.clientX;
            this.mousePosition.y = event.clientY;
        });

        window.addEventListener('mousedown', (event) => {
            this.mouseButtons.set(event.button, true);
        });

        window.addEventListener('mouseup', (event) => {
            this.mouseButtons.set(event.button, false);
        });
    }

    setupGamepadListener() {
        window.addEventListener('gamepadconnected', (event) => {
            console.log('Gamepad conectado:', event.gamepad);
            this.gamepadState = event.gamepad;
        });

        window.addEventListener('gamepaddisconnected', (event) => {
            console.log('Gamepad desconectado:', event.gamepad);
            this.gamepadState = null;
        });
    }

    update() {
        // Atualizar estado do gamepad
        if (this.gamepadState) {
            const gamepads = navigator.getGamepads();
            this.gamepadState = gamepads[this.gamepadState.index];
        }
    }

    isActionPressed(action) {
        const keys = this.keyMap[action];
        if (!keys) return false;
        
        return keys.some(key => this.keys.get(key));
    }

    getMovementVector() {
        const vector = { x: 0, y: 0 };
        
        if (this.isActionPressed('up')) vector.y -= 1;
        if (this.isActionPressed('down')) vector.y += 1;
        if (this.isActionPressed('left')) vector.x -= 1;
        if (this.isActionPressed('right')) vector.x += 1;
        
        // Normalizar vetor para movimento diagonal consistente
        if (vector.x !== 0 && vector.y !== 0) {
            const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
            vector.x /= length;
            vector.y /= length;
        }
        
        return vector;
    }

    getMousePosition() {
        return { ...this.mousePosition };
    }

    isMouseButtonPressed(button) {
        return this.mouseButtons.get(button) || false;
    }

    getGamepadState() {
        if (!this.gamepadState) return null;
        
        const gamepad = this.gamepadState;
        return {
            axes: {
                leftStick: {
                    x: gamepad.axes[0],
                    y: gamepad.axes[1]
                },
                rightStick: {
                    x: gamepad.axes[2],
                    y: gamepad.axes[3]
                }
            },
            buttons: gamepad.buttons.map(button => button.pressed)
        };
    }

    vibrate(duration = 200, strong = 1.0, weak = 1.0) {
        if (this.gamepadState && this.gamepadState.vibrationActuator) {
            this.gamepadState.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: duration,
                weakMagnitude: weak,
                strongMagnitude: strong
            });
        }
    }
}
