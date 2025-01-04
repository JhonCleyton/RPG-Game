class SoundSystem {
    constructor() {
        this.sounds = new Map();
        this.musicTracks = new Map();
        this.currentMusic = null;
        
        // Configurações
        this.masterVolume = 1.0;
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        
        // Contexto de áudio
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        
        // Grupos de áudio
        this.musicGroup = this.audioContext.createGain();
        this.sfxGroup = this.audioContext.createGain();
        
        this.musicGroup.connect(this.masterGain);
        this.sfxGroup.connect(this.masterGain);
        
        // Atualizar volumes
        this.updateVolumes();
    }

    updateVolumes() {
        this.masterGain.gain.value = this.masterVolume;
        this.musicGroup.gain.value = this.musicVolume;
        this.sfxGroup.gain.value = this.sfxVolume;
    }

    async loadSound(key, path, options = {}) {
        try {
            const response = await fetch(path);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.sounds.set(key, {
                buffer: audioBuffer,
                loop: options.loop || false,
                volume: options.volume || 1,
                category: options.category || 'sfx'
            });
            
        } catch (error) {
            console.error(`Erro ao carregar som: ${path}`, error);
        }
    }

    playSound(key, options = {}) {
        const sound = this.sounds.get(key);
        if (!sound) return null;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = sound.buffer;
        
        // Configurar ganho
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = (options.volume || sound.volume) * 
            (sound.category === 'music' ? this.musicVolume : this.sfxVolume);
        
        // Conectar nodes
        source.connect(gainNode);
        gainNode.connect(sound.category === 'music' ? this.musicGroup : this.sfxGroup);
        
        // Configurar loop
        source.loop = options.loop || sound.loop;
        
        // Iniciar playback
        source.start(0);
        
        const soundInstance = {
            source,
            gainNode,
            stop: () => {
                try {
                    source.stop();
                } catch (e) {
                    console.warn('Tentativa de parar som já finalizado');
                }
            },
            setVolume: (value) => {
                gainNode.gain.value = value;
            },
            fadeOut: (duration) => {
                const now = this.audioContext.currentTime;
                gainNode.gain.linearRampToValueAtTime(0, now + duration);
                setTimeout(() => source.stop(), duration * 1000);
            },
            fadeIn: (duration, targetVolume = 1) => {
                const now = this.audioContext.currentTime;
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(targetVolume, now + duration);
            }
        };
        
        return soundInstance;
    }

    playMusic(key, options = {}) {
        // Parar música atual
        if (this.currentMusic) {
            this.currentMusic.fadeOut(options.crossfadeDuration || 1);
        }
        
        // Iniciar nova música
        const musicInstance = this.playSound(key, {
            ...options,
            loop: true,
            volume: 0
        });
        
        if (musicInstance) {
            musicInstance.fadeIn(options.crossfadeDuration || 1, this.musicVolume);
            this.currentMusic = musicInstance;
        }
        
        return musicInstance;
    }

    stopMusic(fadeOutDuration = 1) {
        if (this.currentMusic) {
            this.currentMusic.fadeOut(fadeOutDuration);
            this.currentMusic = null;
        }
    }

    pauseAll() {
        this.audioContext.suspend();
    }

    resumeAll() {
        this.audioContext.resume();
    }

    setMasterVolume(value) {
        this.masterVolume = Math.max(0, Math.min(1, value));
        this.updateVolumes();
    }

    setMusicVolume(value) {
        this.musicVolume = Math.max(0, Math.min(1, value));
        this.updateVolumes();
    }

    setSFXVolume(value) {
        this.sfxVolume = Math.max(0, Math.min(1, value));
        this.updateVolumes();
    }

    // Efeitos sonoros especiais
    playSpatialSound(key, position, options = {}) {
        const sound = this.sounds.get(key);
        if (!sound) return null;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = sound.buffer;
        
        // Criar nó de áudio posicional
        const panNode = this.audioContext.createPanner();
        panNode.panningModel = 'HRTF';
        panNode.distanceModel = 'inverse';
        panNode.refDistance = options.refDistance || 1;
        panNode.maxDistance = options.maxDistance || 10000;
        panNode.rolloffFactor = options.rolloffFactor || 1;
        
        // Posicionar o som
        panNode.positionX.value = position.x;
        panNode.positionY.value = position.y;
        panNode.positionZ.value = position.z || 0;
        
        // Conectar nodes
        source.connect(panNode);
        panNode.connect(this.sfxGroup);
        
        source.start(0);
        
        return {
            source,
            panNode,
            updatePosition: (newPosition) => {
                panNode.positionX.value = newPosition.x;
                panNode.positionY.value = newPosition.y;
                panNode.positionZ.value = newPosition.z || 0;
            },
            stop: () => source.stop()
        };
    }

    createAmbientSound(key, options = {}) {
        const sound = this.sounds.get(key);
        if (!sound) return null;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = sound.buffer;
        source.loop = true;
        
        // Criar filtros para ambiente
        const filterNode = this.audioContext.createBiquadFilter();
        filterNode.type = options.filterType || 'lowpass';
        filterNode.frequency.value = options.filterFrequency || 1000;
        
        const reverbNode = this.audioContext.createConvolver();
        // Configurar reverb...
        
        // Conectar nodes
        source.connect(filterNode);
        filterNode.connect(reverbNode);
        reverbNode.connect(this.sfxGroup);
        
        source.start(0);
        
        return {
            source,
            filterNode,
            reverbNode,
            setFilterFrequency: (value) => {
                filterNode.frequency.value = value;
            },
            stop: () => source.stop()
        };
    }
}
