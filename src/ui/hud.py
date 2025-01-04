import pygame

class HUD:
    def __init__(self, screen):
        self.screen = screen
        self.font = pygame.font.Font(None, 24)
        self.stats = {
            'hp': 100,
            'max_hp': 100,
            'mp': 50,
            'max_mp': 50,
            'xp': 0,
            'level': 1
        }
    
    def update_stats(self, stats):
        self.stats.update(stats)
    
    def render_bar(self, x, y, width, height, value, max_value, color):
        # Background
        pygame.draw.rect(self.screen, (50, 50, 50), (x, y, width, height))
        
        # Fill bar
        if max_value > 0:
            fill_width = int((value / max_value) * width)
            pygame.draw.rect(self.screen, color, (x, y, fill_width, height))
        
        # Border
        pygame.draw.rect(self.screen, (200, 200, 200), (x, y, width, height), 1)
    
    def render(self):
        # HP Bar
        self.render_bar(10, 10, 200, 20, self.stats['hp'], self.stats['max_hp'], (255, 0, 0))
        hp_text = f"HP: {self.stats['hp']}/{self.stats['max_hp']}"
        hp_surface = self.font.render(hp_text, True, (255, 255, 255))
        self.screen.blit(hp_surface, (220, 10))
        
        # MP Bar
        self.render_bar(10, 40, 200, 20, self.stats['mp'], self.stats['max_mp'], (0, 0, 255))
        mp_text = f"MP: {self.stats['mp']}/{self.stats['max_mp']}"
        mp_surface = self.font.render(mp_text, True, (255, 255, 255))
        self.screen.blit(mp_surface, (220, 40))
        
        # Level and XP
        level_text = f"Level: {self.stats['level']}"
        level_surface = self.font.render(level_text, True, (255, 255, 255))
        self.screen.blit(level_surface, (10, 70))
        
        xp_text = f"XP: {self.stats['xp']}"
        xp_surface = self.font.render(xp_text, True, (255, 255, 255))
        self.screen.blit(xp_surface, (100, 70))
