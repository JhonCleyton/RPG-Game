import pygame

class SoundSystem:
    def __init__(self):
        pygame.mixer.init()
        self.sounds = {}
        self.music = None
        self.sound_volume = 1.0
        self.music_volume = 1.0
    
    def play_sound(self, sound):
        if sound in self.sounds:
            self.sounds[sound].set_volume(self.sound_volume)
            self.sounds[sound].play()
    
    def play_music(self, music_file):
        if self.music != music_file:
            self.music = music_file
            pygame.mixer.music.load(music_file)
            pygame.mixer.music.set_volume(self.music_volume)
            pygame.mixer.music.play(-1)
    
    def stop_music(self):
        pygame.mixer.music.stop()
        self.music = None
    
    def set_sound_volume(self, volume):
        self.sound_volume = max(0.0, min(1.0, volume))
    
    def set_music_volume(self, volume):
        self.music_volume = max(0.0, min(1.0, volume))
        if self.music:
            pygame.mixer.music.set_volume(self.music_volume)
