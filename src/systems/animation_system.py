from typing import Dict, List, Optional, Tuple
import pygame

class Animation:
    def __init__(self, frames: List[pygame.Surface], frame_duration: float = 0.1, loop: bool = True):
        self.frames = frames
        self.frame_duration = frame_duration
        self.loop = loop
        self.current_frame = 0
        self.time_elapsed = 0
        self.finished = False
        
    def update(self, delta_time: float):
        """Atualiza a animação."""
        if self.finished:
            return
            
        self.time_elapsed += delta_time
        
        # Verifica se é hora de mudar de frame
        while self.time_elapsed >= self.frame_duration:
            self.time_elapsed -= self.frame_duration
            self.current_frame += 1
            
            # Se chegou ao fim dos frames
            if self.current_frame >= len(self.frames):
                if self.loop:
                    self.current_frame = 0
                else:
                    self.current_frame = len(self.frames) - 1
                    self.finished = True
                    
    def get_current_frame(self) -> pygame.Surface:
        """Retorna o frame atual."""
        return self.frames[self.current_frame]
        
    def reset(self):
        """Reinicia a animação."""
        self.current_frame = 0
        self.time_elapsed = 0
        self.finished = False

class AnimationSystem:
    def __init__(self):
        self.animations: Dict[str, Animation] = {}
        self.active_animations: Dict[str, Animation] = {}
        
    def load_spritesheet(self, path: str, frame_width: int, frame_height: int) -> List[pygame.Surface]:
        """Carrega um spritesheet e retorna uma lista de frames."""
        try:
            spritesheet = pygame.image.load(path).convert_alpha()
            frames = []
            
            sheet_width = spritesheet.get_width()
            sheet_height = spritesheet.get_height()
            
            for y in range(0, sheet_height, frame_height):
                for x in range(0, sheet_width, frame_width):
                    frame = pygame.Surface((frame_width, frame_height), pygame.SRCALPHA)
                    frame.blit(spritesheet, (0, 0), (x, y, frame_width, frame_height))
                    frames.append(frame)
                    
            return frames
        except Exception as e:
            print(f"Erro ao carregar spritesheet {path}: {e}")
            return []
            
    def create_animation(self, name: str, frames: List[pygame.Surface], 
                        frame_duration: float = 0.1, loop: bool = True):
        """Cria uma nova animação."""
        self.animations[name] = Animation(frames, frame_duration, loop)
        
    def play_animation(self, name: str, entity_id: str) -> bool:
        """Inicia uma animação para uma entidade específica."""
        if name not in self.animations:
            return False
            
        animation = self.animations[name]
        animation.reset()
        self.active_animations[entity_id] = animation
        return True
        
    def stop_animation(self, entity_id: str):
        """Para a animação de uma entidade."""
        if entity_id in self.active_animations:
            del self.active_animations[entity_id]
            
    def update(self, delta_time: float):
        """Atualiza todas as animações ativas."""
        # Remove animações finalizadas que não são em loop
        finished_animations = []
        
        for entity_id, animation in self.active_animations.items():
            animation.update(delta_time)
            if animation.finished:
                finished_animations.append(entity_id)
                
        for entity_id in finished_animations:
            self.stop_animation(entity_id)
            
    def draw(self, screen: pygame.Surface):
        """Desenha todas as animações ativas."""
        # Será implementado quando tivermos um sistema de renderização
        # que saiba as posições das entidades
        pass

class ParticleAnimation:
    def __init__(self, x: float, y: float, duration: float, sprite: pygame.Surface = None):
        self.x = x
        self.y = y
        self.duration = duration
        self.time_elapsed = 0
        self.sprite = sprite
        self.active = True
        
        # Movement
        self.velocity_x = 0
        self.velocity_y = 0
        self.acceleration_x = 0
        self.acceleration_y = 0
        
        # Appearance
        self.scale = 1.0
        self.rotation = 0
        self.alpha = 255
        
        # Animation properties
        self.scale_speed = 0
        self.rotation_speed = 0
        self.fade_speed = 0
        
    def update(self, delta_time: float):
        """Update particle state"""
        if not self.active:
            return
            
        self.time_elapsed += delta_time
        
        # Check if particle has expired
        if self.time_elapsed >= self.duration:
            self.active = False
            return
            
        # Update position
        self.velocity_x += self.acceleration_x * delta_time
        self.velocity_y += self.acceleration_y * delta_time
        self.x += self.velocity_x * delta_time
        self.y += self.velocity_y * delta_time
        
        # Update appearance
        self.scale += self.scale_speed * delta_time
        self.rotation += self.rotation_speed * delta_time
        self.alpha = max(0, min(255, self.alpha - self.fade_speed * delta_time))
        
    def draw(self, screen: pygame.Surface):
        """Draw the particle"""
        if not self.active or not self.sprite:
            return
            
        # Create a copy of the sprite for transformation
        sprite = self.sprite.copy()
        
        # Apply scale
        if self.scale != 1.0:
            new_size = (int(sprite.get_width() * self.scale), int(sprite.get_height() * self.scale))
            sprite = pygame.transform.scale(sprite, new_size)
            
        # Apply rotation
        if self.rotation != 0:
            sprite = pygame.transform.rotate(sprite, self.rotation)
            
        # Apply alpha
        if self.alpha != 255:
            sprite.set_alpha(int(self.alpha))
            
        # Draw centered at position
        rect = sprite.get_rect()
        rect.center = (int(self.x), int(self.y))
        screen.blit(sprite, rect)
