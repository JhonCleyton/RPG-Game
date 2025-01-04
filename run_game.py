"""
RPG Game Framework
Desenvolvido por JC Bytes - Soluções em Tecnologia
Website: jcbytes.com.br
Email: contato@jcbytes.com.br
"""

import os
import sys
import pygame

# Adiciona o diretório src ao path do Python
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from main import Game

# Configuração da janela do jogo
pygame.init()
pygame.display.set_caption("RPG Game - JC Bytes")

if __name__ == '__main__':
    print("JC Bytes - RPG Game Framework")
    print("Iniciando o jogo...")
    game = Game()
    game.run()
