import pygame

class TimeSystem:
    def __init__(self):
        self.clock = pygame.time.Clock()
        self.delta_time = 0
        self.fps = 60
    
    def update(self):
        self.delta_time = self.clock.tick(self.fps) / 1000.0  # Convert to seconds
    
    def get_delta_time(self):
        return self.delta_time
    
    def get_fps(self):
        return self.clock.get_fps()
    
    def set_fps(self, fps):
        self.fps = fps
