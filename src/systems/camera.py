class Camera:
    def __init__(self, width: int, height: int):
        self.x = 0
        self.y = 0
        self.width = width
        self.height = height
        
    def move_to(self, target_x: float, target_y: float):
        """Move a câmera para a posição do alvo (geralmente o jogador)."""
        # Centraliza a câmera no alvo
        self.x = target_x - self.width // 2
        self.y = target_y - self.height // 2
        
    def apply(self, x: float, y: float) -> tuple[float, float]:
        """Aplica o deslocamento da câmera a uma posição."""
        return x - self.x, y - self.y
