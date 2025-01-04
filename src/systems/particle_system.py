from typing import Dict, List, Optional, Tuple
import pygame
import random
import math

class Particle:
    def __init__(self, x: float, y: float, velocity: Tuple[float, float], 
                 color: Tuple[int, int, int], size: int, lifetime: float,
                 gravity: float = 0):
        self.x = x
        self.y = y
        self.velocity = list(velocity)
        self.color = color
        self.size = size
        self.lifetime = lifetime
        self.time_left = lifetime
        self.gravity = gravity
        self.alpha = 255
        
    def update(self, delta_time: float):
        """Atualiza a partícula."""
        self.time_left -= delta_time
        
        # Atualiza posição
        self.x += self.velocity[0] * delta_time
        self.y += self.velocity[1] * delta_time
        
        # Aplica gravidade
        self.velocity[1] += self.gravity * delta_time
        
        # Atualiza transparência
        self.alpha = int((self.time_left / self.lifetime) * 255)
        
    def is_alive(self) -> bool:
        """Verifica se a partícula ainda está viva."""
        return self.time_left > 0
        
    def draw(self, screen: pygame.Surface, camera_x: int = 0, camera_y: int = 0):
        """Desenha a partícula."""
        if self.alpha <= 0:
            return
            
        # Cria uma superfície para a partícula com alpha
        particle_surface = pygame.Surface((self.size, self.size), pygame.SRCALPHA)
        color_with_alpha = (*self.color, self.alpha)
        pygame.draw.circle(particle_surface, color_with_alpha, 
                         (self.size // 2, self.size // 2), self.size // 2)
                         
        # Desenha na tela
        screen.blit(particle_surface, 
                   (self.x - camera_x - self.size // 2, 
                    self.y - camera_y - self.size // 2))

class ParticleSystem:
    def __init__(self):
        self.particles: List[Particle] = []
        
    def create_particle(self, x: float, y: float, 
                       velocity: Optional[Tuple[float, float]] = None,
                       color: Optional[Tuple[int, int, int]] = None,
                       size: Optional[int] = None,
                       lifetime: Optional[float] = None,
                       gravity: float = 0):
        """Cria uma nova partícula."""
        # Valores padrão
        if velocity is None:
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(50, 100)
            velocity = (math.cos(angle) * speed, math.sin(angle) * speed)
            
        if color is None:
            color = (random.randint(0, 255), 
                    random.randint(0, 255), 
                    random.randint(0, 255))
                    
        if size is None:
            size = random.randint(2, 6)
            
        if lifetime is None:
            lifetime = random.uniform(0.5, 2.0)
            
        particle = Particle(x, y, velocity, color, size, lifetime, gravity)
        self.particles.append(particle)
        
    def create_explosion(self, x: float, y: float, particle_count: int = 20):
        """Cria um efeito de explosão."""
        for _ in range(particle_count):
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(100, 200)
            velocity = (math.cos(angle) * speed, math.sin(angle) * speed)
            
            color = (random.randint(200, 255),  # Vermelho
                    random.randint(0, 100),     # Verde
                    0)                          # Azul
                    
            self.create_particle(x, y, velocity, color, 
                               random.randint(4, 8), 
                               random.uniform(0.5, 1.0),
                               gravity=200)
                               
    def create_sparkle(self, x: float, y: float, particle_count: int = 5):
        """Cria um efeito de brilho."""
        for _ in range(particle_count):
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(20, 50)
            velocity = (math.cos(angle) * speed, math.sin(angle) * speed)
            
            color = (255, 255, random.randint(200, 255))  # Branco/Amarelo
            
            self.create_particle(x, y, velocity, color,
                               random.randint(2, 4),
                               random.uniform(0.2, 0.5))
                               
    def create_trail(self, x: float, y: float, direction: Tuple[float, float],
                    color: Tuple[int, int, int], particle_count: int = 1):
        """Cria um efeito de rastro."""
        for _ in range(particle_count):
            offset_x = random.uniform(-5, 5)
            offset_y = random.uniform(-5, 5)
            
            # Velocidade oposta à direção do movimento
            speed = random.uniform(10, 30)
            velocity = (-direction[0] * speed + random.uniform(-10, 10),
                      -direction[1] * speed + random.uniform(-10, 10))
                      
            self.create_particle(x + offset_x, y + offset_y,
                               velocity, color,
                               random.randint(2, 4),
                               random.uniform(0.2, 0.5))
                               
    def update(self, delta_time: float):
        """Atualiza todas as partículas."""
        # Atualiza e remove partículas mortas
        self.particles = [particle for particle in self.particles 
                         if particle.is_alive()]
                         
        for particle in self.particles:
            particle.update(delta_time)
            
    def draw(self, screen: pygame.Surface, camera_x: int = 0, camera_y: int = 0):
        """Desenha todas as partículas."""
        for particle in self.particles:
            particle.draw(screen, camera_x, camera_y)
