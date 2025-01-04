import pygame
import json
import os

class Tile:
    def __init__(self, tile_id, image, solid=False):
        self.id = tile_id
        self.image = image
        self.solid = solid

class Map:
    def __init__(self, width, height, tile_size=32):
        self.width = width
        self.height = height
        self.tile_size = tile_size
        self.layers = {
            'ground': [[0 for _ in range(width)] for _ in range(height)],
            'objects': [[0 for _ in range(width)] for _ in range(height)],
            'collision': [[False for _ in range(width)] for _ in range(height)]
        }
        self.tiles = {}
        self.npcs = []
        self.items = []
        self.spawn_points = {}
    
    def load_from_file(self, filename):
        with open(filename, 'r') as f:
            data = json.load(f)
            self.width = data['width']
            self.height = data['height']
            self.layers = data['layers']
            self.spawn_points = data['spawn_points']
    
    def save_to_file(self, filename):
        data = {
            'width': self.width,
            'height': self.height,
            'layers': self.layers,
            'spawn_points': self.spawn_points
        }
        with open(filename, 'w') as f:
            json.dump(data, f)
    
    def is_solid(self, x, y):
        if 0 <= x < self.width and 0 <= y < self.height:
            return self.layers['collision'][y][x]
        return True
    
    def get_tile(self, layer, x, y):
        if 0 <= x < self.width and 0 <= y < self.height:
            tile_id = self.layers[layer][y][x]
            return self.tiles.get(tile_id)
        return None
    
    def set_tile(self, layer, x, y, tile_id):
        if 0 <= x < self.width and 0 <= y < self.height:
            self.layers[layer][y][x] = tile_id
    
    def add_npc(self, npc):
        self.npcs.append(npc)
    
    def add_item(self, item):
        self.items.append(item)
    
    def get_spawn_point(self, name):
        return self.spawn_points.get(name)

class MapSystem:
    def __init__(self, asset_system):
        self.asset_system = asset_system
        self.current_map = None
        self.maps = {}
        self.tile_size = 32
        self.camera_x = 0
        self.camera_y = 0
    
    def load_map(self, map_name):
        if map_name in self.maps:
            self.current_map = self.maps[map_name]
            return True
        return False
    
    def create_map(self, map_name, width, height):
        new_map = Map(width, height, self.tile_size)
        self.maps[map_name] = new_map
        return new_map
    
    def set_camera(self, x, y):
        self.camera_x = x
        self.camera_y = y
    
    def world_to_screen(self, world_x, world_y):
        screen_x = world_x - self.camera_x
        screen_y = world_y - self.camera_y
        return screen_x, screen_y
    
    def screen_to_world(self, screen_x, screen_y):
        world_x = screen_x + self.camera_x
        world_y = screen_y + self.camera_y
        return world_x, world_y
    
    def render(self, screen):
        if not self.current_map:
            return
        
        # Calculate visible area
        start_x = max(0, self.camera_x // self.tile_size)
        start_y = max(0, self.camera_y // self.tile_size)
        end_x = min(self.current_map.width, (self.camera_x + screen.get_width()) // self.tile_size + 1)
        end_y = min(self.current_map.height, (self.camera_y + screen.get_height()) // self.tile_size + 1)
        
        # Render ground layer
        for y in range(start_y, end_y):
            for x in range(start_x, end_x):
                tile = self.current_map.get_tile('ground', x, y)
                if tile:
                    screen_x, screen_y = self.world_to_screen(x * self.tile_size, y * self.tile_size)
                    screen.blit(tile.image, (screen_x, screen_y))
        
        # Render object layer
        for y in range(start_y, end_y):
            for x in range(start_x, end_x):
                tile = self.current_map.get_tile('objects', x, y)
                if tile:
                    screen_x, screen_y = self.world_to_screen(x * self.tile_size, y * self.tile_size)
                    screen.blit(tile.image, (screen_x, screen_y))
        
        # Render NPCs
        for npc in self.current_map.npcs:
            screen_x, screen_y = self.world_to_screen(npc.x, npc.y)
            if 0 <= screen_x < screen.get_width() and 0 <= screen_y < screen.get_height():
                npc.render(screen, screen_x, screen_y)
        
        # Render items
        for item in self.current_map.items:
            screen_x, screen_y = self.world_to_screen(item.x, item.y)
            if 0 <= screen_x < screen.get_width() and 0 <= screen_y < screen.get_height():
                item.render(screen, screen_x, screen_y)
