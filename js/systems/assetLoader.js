class AssetLoader {
    constructor() {
        this.images = new Map();
        this.sounds = new Map();
        this.maps = new Map();
        this.fonts = new Map();
        this.totalAssets = 0;
        this.loadedAssets = 0;
    }

    async loadAll() {
        try {
            // Atualizar barra de progresso
            const loadingProgress = document.getElementById('loadingProgress');
            const loadingText = document.getElementById('loadingText');

            // Carregar assets
            await Promise.all([
                this.loadImages(),
                this.loadSounds(),
                this.loadMaps(),
                this.loadFonts()
            ]);

            // Remover tela de loading
            const loadingScreen = document.getElementById('loadingScreen');
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);

            return true;
        } catch (error) {
            console.error('Erro ao carregar assets:', error);
            return false;
        }
    }

    updateLoadingProgress() {
        this.loadedAssets++;
        const progress = (this.loadedAssets / this.totalAssets) * 100;
        
        const loadingProgress = document.getElementById('loadingProgress');
        const loadingText = document.getElementById('loadingText');
        
        loadingProgress.style.width = `${progress}%`;
        loadingText.textContent = `Carregando... ${Math.floor(progress)}%`;
    }

    async loadImages() {
        const imagesToLoad = {
            // Sprites do jogador
            'player_warrior': 'assets/sprites/player/warrior.png',
            'player_mage': 'assets/sprites/player/mage.png',
            'player_archer': 'assets/sprites/player/archer.png',
            
            // Sprites de NPCs
            'npc_elder_sage': 'assets/sprites/npcs/elder_sage.png',
            'npc_merchant': 'assets/sprites/npcs/merchant.png',
            'npc_guard': 'assets/sprites/npcs/guard.png',
            'npc_blacksmith': 'assets/sprites/npcs/blacksmith.png',
            
            // Sprites de inimigos
            'enemy_slime': 'assets/sprites/enemies/slime.png',
            'enemy_skeleton': 'assets/sprites/enemies/skeleton.png',
            'enemy_boss': 'assets/sprites/enemies/boss.png',
            
            // Tiles do mapa
            'tileset_grass': 'assets/tiles/grass.png',
            'tileset_dungeon': 'assets/tiles/dungeon.png',
            'tileset_village': 'assets/tiles/village.png',
            
            // Items
            'item_potion': 'assets/items/potion.png',
            'item_sword': 'assets/items/sword.png',
            'item_shield': 'assets/items/shield.png',
            
            // UI
            'ui_inventory': 'assets/ui/inventory.png',
            'ui_dialog': 'assets/ui/dialog.png',
            'ui_quest': 'assets/ui/quest.png',
            
            // Backgrounds
            'menu_bg_far': 'assets/backgrounds/menu_far.png',
            'menu_bg_mid': 'assets/backgrounds/menu_mid.png',
            'menu_bg_near': 'assets/backgrounds/menu_near.png'
        };

        this.totalAssets += Object.keys(imagesToLoad).length;

        const imagePromises = Object.entries(imagesToLoad).map(([key, path]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.images.set(key, img);
                    this.updateLoadingProgress();
                    resolve();
                };
                img.onerror = () => reject(`Falha ao carregar imagem: ${path}`);
                img.src = path;
            });
        });

        await Promise.all(imagePromises);
    }

    async loadSounds() {
        const soundsToLoad = {
            // Música
            'menu_theme': 'assets/music/menu_theme.mp3',
            'village_theme': 'assets/music/village_theme.mp3',
            'battle_theme': 'assets/music/battle_theme.mp3',
            'dungeon_theme': 'assets/music/dungeon_theme.mp3',
            
            // Efeitos sonoros
            'sword_swing': 'assets/sfx/sword_swing.wav',
            'magic_cast': 'assets/sfx/magic_cast.wav',
            'arrow_shoot': 'assets/sfx/arrow_shoot.wav',
            'hit_impact': 'assets/sfx/hit_impact.wav',
            'item_pickup': 'assets/sfx/item_pickup.wav',
            'level_up': 'assets/sfx/level_up.wav',
            'button_click': 'assets/sfx/button_click.wav'
        };

        this.totalAssets += Object.keys(soundsToLoad).length;

        const soundPromises = Object.entries(soundsToLoad).map(([key, path]) => {
            return new Promise((resolve, reject) => {
                const audio = new Audio();
                audio.oncanplaythrough = () => {
                    this.sounds.set(key, audio);
                    this.updateLoadingProgress();
                    resolve();
                };
                audio.onerror = () => reject(`Falha ao carregar som: ${path}`);
                audio.src = path;
            });
        });

        await Promise.all(soundPromises);
    }

    async loadMaps() {
        const mapsToLoad = {
            'village': 'assets/maps/village.json',
            'dungeon': 'assets/maps/dungeon.json',
            'forest': 'assets/maps/forest.json'
        };

        this.totalAssets += Object.keys(mapsToLoad).length;

        const mapPromises = Object.entries(mapsToLoad).map(([key, path]) => {
            return fetch(path)
                .then(response => response.json())
                .then(mapData => {
                    this.maps.set(key, mapData);
                    this.updateLoadingProgress();
                })
                .catch(error => console.error(`Falha ao carregar mapa: ${path}`, error));
        });

        await Promise.all(mapPromises);
    }

    async loadFonts() {
        const fontsToLoad = {
            'MedievalFont': 'assets/fonts/medieval.ttf'
        };

        this.totalAssets += Object.keys(fontsToLoad).length;

        const fontPromises = Object.entries(fontsToLoad).map(([key, path]) => {
            return new FontFace(key, `url(${path})`).load()
                .then(font => {
                    document.fonts.add(font);
                    this.fonts.set(key, font);
                    this.updateLoadingProgress();
                })
                .catch(error => console.error(`Falha ao carregar fonte: ${path}`, error));
        });

        await Promise.all(fontPromises);
    }

    getImage(key) {
        return this.images.get(key);
    }

    getSound(key) {
        return this.sounds.get(key);
    }

    getMap(key) {
        return this.maps.get(key);
    }

    getFont(key) {
        return this.fonts.get(key);
    }
}
