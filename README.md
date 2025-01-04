# RPG Game Framework
### Desenvolvido por JC Bytes - Soluções em Tecnologia

## Sobre o Projeto
Este é um framework para desenvolvimento de jogos RPG 2D usando Python e Pygame. O projeto oferece uma base sólida para criar jogos com elementos clássicos de RPG, incluindo personagens, NPCs, sistema de combate, inventário, quests e mais.

## Estrutura do Projeto
```
rpg-game/
├── assets/
│   ├── fonts/          # Fontes do jogo
│   ├── images/         # Imagens e sprites
│   │   ├── characters/ # Sprites de personagens
│   │   ├── items/      # Sprites de itens
│   │   ├── maps/       # Texturas de mapas
│   │   ├── ui/         # Elementos de interface
│   │   └── effects/    # Efeitos visuais
│   ├── maps/           # Arquivos JSON de mapas
│   ├── data/           # Dados do jogo (items.json, quests.json, etc)
│   └── sounds/         # Efeitos sonoros e músicas
├── src/
│   ├── entities/       # Classes de entidades
│   ├── systems/        # Sistemas do jogo
│   ├── map/           # Sistema de mapas
│   └── ui/            # Interface do usuário
└── tests/             # Testes unitários
```

## Requisitos de Imagens

### Personagens (assets/images/characters/)
- Formato: PNG com transparência
- Tamanho: 32x32 pixels por frame
- Animações necessárias:
  - walk_down: 4 frames
  - walk_up: 4 frames
  - walk_left: 4 frames
  - walk_right: 4 frames
  - idle: 1 frame por direção
  - attack: 4 frames por direção
  - Nomenclatura: `character_name_action_direction_frame.png`
  - Exemplo: `player_walk_down_0.png`

### NPCs (assets/images/characters/npc/)
- Formato: PNG com transparência
- Tamanho: 32x32 pixels
- Animações: Mesmo padrão dos personagens
- Nomenclatura: `npc_type_action_direction_frame.png`
- Exemplo: `merchant_idle_down_0.png`

### Itens (assets/images/items/)
- Formato: PNG com transparência
- Tamanho: 16x16 ou 32x32 pixels
- Categorias:
  - weapons/: Armas
  - armor/: Armaduras
  - consumables/: Itens consumíveis
  - quest/: Itens de quest
- Nomenclatura: `item_name.png`
- Exemplo: `iron_sword.png`

### Mapas (assets/images/maps/)
- Formato: PNG
- Tamanho dos tiles: 32x32 pixels
- Categorias:
  - tiles/: Texturas básicas (grama, terra, água)
  - objects/: Objetos de cenário (árvores, rochas)
  - buildings/: Construções
  - decorations/: Elementos decorativos
- Nomenclatura: `category_name.png`
- Exemplo: `tiles_grass.png`

### Interface (assets/images/ui/)
- Formato: PNG com transparência
- Elementos necessários:
  - buttons.png: 32x32 pixels
  - icons.png: 16x16 pixels
  - bars.png: 200x20 pixels
  - windows.png: Templates de janelas
  - cursors.png: Cursores do mouse

### Efeitos (assets/images/effects/)
- Formato: PNG com transparência
- Tamanho: Variável
- Animações necessárias para:
  - Magias
  - Impactos
  - Partículas
- Nomenclatura: `effect_name_frame.png`

## Recursos Pendentes

### Sistema de Som
- Implementar carregamento de sons
- Adicionar música de fundo
- Adicionar efeitos sonoros para:
  - Ações do jogador
  - Combate
  - Ambiente
  - Interface

### Sistema de Mapas
- Implementar editor de mapas
- Adicionar sistema de camadas
- Implementar transições entre mapas
- Adicionar eventos de mapa

### Sistema de Combate
- Implementar mecânicas de combate
- Adicionar sistema de dano
- Implementar habilidades especiais
- Adicionar efeitos de status

### Sistema de Salvamento
- Implementar salvamento do estado do jogo
- Adicionar múltiplos slots de save
- Implementar autosave

### Interface do Usuário
- Implementar menu principal
- Adicionar menu de pausa
- Implementar interface de inventário
- Adicionar janela de status
- Implementar sistema de diálogo com escolhas

### Inteligência Artificial
- Implementar pathfinding para NPCs
- Adicionar comportamentos complexos para monstros
- Implementar sistema de eventos

### Otimização
- Implementar culling de objetos fora da tela
- Otimizar renderização de tiles
- Adicionar sistema de partículas eficiente

## Como Contribuir
1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença
Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE.md para detalhes.

## Contato
JC Bytes - Soluções em Tecnologia
- Email: jhon.freire@ftc.edu.br
- GitHub: [github.com/jcbytes](https://github.com/JhonCleyton)

---
Desenvolvido com ❤️ por JC Bytes - Soluções em Tecnologia
