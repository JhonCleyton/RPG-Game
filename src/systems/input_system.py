import pygame

class InputSystem:
    def __init__(self):
        self.keys = {}
        self.mouse_pos = (0, 0)
        self.mouse_buttons = [False, False, False]
    
    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            self.keys[event.key] = True
        elif event.type == pygame.KEYUP:
            self.keys[event.key] = False
        elif event.type == pygame.MOUSEMOTION:
            self.mouse_pos = event.pos
        elif event.type == pygame.MOUSEBUTTONDOWN:
            self.mouse_buttons[event.button-1] = True
        elif event.type == pygame.MOUSEBUTTONUP:
            self.mouse_buttons[event.button-1] = False
    
    def is_key_pressed(self, key):
        return self.keys.get(key, False)
    
    def is_mouse_button_pressed(self, button):
        return self.mouse_buttons[button-1]
    
    def get_mouse_pos(self):
        return self.mouse_pos
