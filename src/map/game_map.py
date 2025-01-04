import pygame
from typing import List, Optional, Tuple

class Tile:
    def __init__(self, x: int, y: int, tile_type: str, sprite: Optional[pygame.Surface] = None):
        self.x = x
        self.y = y
        self.type = tile_type  # "grass", "water", "wall", etc.
        self.sprite = sprite
        self.walkable = tile_type != "wall"
        self.size = 32  # Tamanho padrão do tile

class GameMap:
    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height
        self.tile_size = 32
        self.tiles: List[List[Tile]] = []
        self.generate_map()
        
    def generate_map(self):
        """Gera um mapa básico para teste."""
        # Cria uma superfície verde para representar grama
        grass_surface = pygame.Surface((self.tile_size, self.tile_size))
        grass_surface.fill((34, 139, 34))  # Verde escuro
        
        # Cria uma superfície cinza para representar paredes
        wall_surface = pygame.Surface((self.tile_size, self.tile_size))
        wall_surface.fill((128, 128, 128))  # Cinza
        
        # Gera o mapa
        for y in range(self.height):
            row = []
            for x in range(self.width):
                # Coloca paredes nas bordas do mapa
                if (x == 0 or x == self.width - 1 or 
                    y == 0 or y == self.height - 1):
                    tile = Tile(x, y, "wall", wall_surface)
                else:
                    tile = Tile(x, y, "grass", grass_surface)
                row.append(tile)
            self.tiles.append(row)
            
    def get_tile(self, x: int, y: int) -> Optional[Tile]:
        """Retorna o tile na posição especificada."""
        if 0 <= x < self.width and 0 <= y < self.height:
            return self.tiles[y][x]
        return None
        
    def is_walkable(self, x: int, y: int) -> bool:
        """Verifica se uma posição é atravessável."""
        tile = self.get_tile(x, y)
        return tile and tile.walkable
        
    def draw(self, screen: pygame.Surface, camera_x: int, camera_y: int):
        """Desenha o mapa na tela."""
        # Calcula quais tiles estão visíveis na tela
        start_x = max(0, camera_x // self.tile_size)
        start_y = max(0, camera_y // self.tile_size)
        end_x = min(self.width, (camera_x + screen.get_width()) // self.tile_size + 1)
        end_y = min(self.height, (camera_y + screen.get_height()) // self.tile_size + 1)
        
        # Desenha apenas os tiles visíveis
        for y in range(start_y, end_y):
            for x in range(start_x, end_x):
                tile = self.tiles[y][x]
                if tile.sprite:
                    screen_x = tile.x * self.tile_size - camera_x
                    screen_y = tile.y * self.tile_size - camera_y
                    screen.blit(tile.sprite, (screen_x, screen_y))
