import pygame
import os

class AssetSystem:
    def __init__(self):
        self.images = {}
        self.sounds = {}
        self.fonts = {}
        self.base_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'assets')
    
    def load_image(self, name):
        if name not in self.images:
            path = os.path.join(self.base_path, 'images', name)
            self.images[name] = pygame.image.load(path).convert_alpha()
        return self.images[name]
    
    def load_sound(self, name):
        if name not in self.sounds:
            path = os.path.join(self.base_path, 'sounds', name)
            self.sounds[name] = pygame.mixer.Sound(path)
        return self.sounds[name]
    
    def load_font(self, name, size):
        key = f"{name}_{size}"
        if key not in self.fonts:
            path = os.path.join(self.base_path, 'fonts', name)
            self.fonts[key] = pygame.font.Font(path, size)
        return self.fonts[key]
