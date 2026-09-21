/*
 * Todas as coordenadas usam o espaço original das imagens: 1536 x 864.
 * Para ajustar colisões, pressione F2 durante o jogo para vê-las na tela.
 * F3 mostra a coordenada do mouse no cenário.
 *
 * blocked: retângulos sólidos [x, y, largura, altura]
 * walkable: regiões onde os pés do personagem podem estar. Se vazio, todo o canvas é permitido.
 * doors: áreas interativas. O jogador precisa estar próximo e pressionar E/Espaço.
 */

window.SCENES = {
  exterior_fechado: {
    image: 'assets/scenes/exterior_fechado.jpg',
    playerScale: 0.15,
    spawn: { x: 768, y: 792, dir: 'up' },
    walkable: [
      [0, 660, 1536, 204],
      [680, 520, 175, 180]
    ],
    blocked: [
      [0, 490, 700, 175],
      [835, 490, 701, 175],
      [706, 520, 125, 95]
    ],
    doors: [
      { x: 700, y: 515, w: 140, h: 120, action: 'openGate', label: 'Abrir o portão' }
    ]
  },

  exterior_aberto: {
    image: 'assets/scenes/exterior_aberto.jpg',
    playerScale: 0.15,
    spawn: { x: 768, y: 705, dir: 'up' },
    walkable: [
      [0, 660, 1536, 204],
      [690, 470, 160, 230],
      [665, 300, 210, 215]
    ],
    blocked: [
      [0, 480, 680, 180],
      [860, 480, 676, 180],
      [0, 0, 640, 500],
      [900, 0, 636, 500],
      [640, 0, 260, 265]
    ],
    doors: [
      { x: 704, y: 245, w: 130, h: 145, target: 'sala', spawn: { x: 770, y: 700, dir: 'up' }, label: 'Entrar na casa' }
    ]
  },

  sala: {
    image: 'assets/scenes/sala.jpg',
    playerScale: 0.145,
    spawn: { x: 775, y: 695, dir: 'up' },
    walkable: [
      [42, 48, 1205, 635],
      [615, 615, 350, 245],
      [1240, 430, 220, 255]
    ],
    blocked: [
      // TV e móveis da parede esquerda
      [42, 250, 150, 355],
      [55, 505, 105, 150],
      // poltrona / mesinha
      [355, 500, 180, 155],
      [520, 520, 80, 100],
      // mesa de centro
      [445, 320, 165, 185],
      // sofá central — de frente para a TV
      [605, 270, 170, 315],
      // estante superior
      [340, 70, 260, 165],
      // aparador / decoração superior centro-direita
      [790, 80, 220, 150],
      [985, 120, 95, 155],
      // aparador e planta próximos à escada
      [1160, 290, 125, 245],
      [1160, 520, 125, 155],
      // paredes laterais da entrada inferior
      [0, 675, 610, 189],
      [965, 675, 571, 189]
    ],
    doors: [
      { x: 120, y: 55, w: 125, h: 170, target: 'cozinha', spawn: { x: 245, y: 760, dir: 'up' }, label: 'Entrar na cozinha' },
      { x: 682, y: 50, w: 135, h: 180, target: 'quintal', spawn: { x: 770, y: 765, dir: 'up' }, label: 'Ir ao quintal' },
      { x: 1030, y: 80, w: 135, h: 190, action: 'unavailable', label: 'Banheiro' },
      { x: 1260, y: 485, w: 190, h: 190, target: 'lobby', spawn: { x: 770, y: 625, dir: 'up' }, label: 'Subir para o segundo andar' },
      { x: 690, y: 625, w: 160, h: 200, target: 'exterior_aberto', spawn: { x: 768, y: 395, dir: 'down' }, label: 'Sair da casa' }
    ]
  },

  cozinha: {
    image: 'assets/scenes/cozinha.jpg',
    playerScale: 0.145,
    spawn: { x: 250, y: 760, dir: 'up' },
    walkable: [
      [25, 300, 1115, 525],
      [1200, 320, 300, 460],
      [135, 710, 240, 154]
    ],
    blocked: [
      [120, 20, 225, 335],                    // geladeira
      [340, 0, 770, 305],                     // bancada + armários + fogão
      [45, 370, 170, 280],                    // aparador lateral
      [450, 395, 450, 300],                   // mesa e cadeiras
      [1110, 0, 145, 610],                    // divisória da área de serviço
      [1225, 80, 115, 200],                   // tanque
      [1320, 110, 150, 245],                  // máquina de lavar
      [1370, 525, 135, 250],                  // móvel inferior direito
      [0, 790, 145, 74],
      [375, 790, 1161, 74]
    ],
    doors: [
      { x: 130, y: 700, w: 255, h: 164, target: 'sala', spawn: { x: 200, y: 245, dir: 'down' }, label: 'Voltar para a sala' }
    ]
  },

  quintal: {
    image: 'assets/scenes/quintal.jpg',
    playerScale: 0.145,
    spawn: { x: 770, y: 750, dir: 'up' },
    walkable: [
      [165, 245, 1195, 500],
      [630, 675, 285, 189]
    ],
    blocked: [
      [0, 0, 465, 365],                       // árvore/canteiro esquerdo
      [255, 195, 440, 395],                   // mesa, cadeiras e guarda-sol
      [625, 35, 330, 245],                    // floreira superior
      [950, 60, 300, 250],                    // bancada de ferramentas
      [1240, 280, 275, 385],                  // banco e vegetação direita
      [0, 285, 185, 470],                     // canteiro lateral
      [510, 630, 150, 130],                   // vasos inferiores esquerda da passagem
      [885, 630, 155, 130]                    // vasos inferiores direita da passagem
    ],
    doors: [
      { x: 625, y: 665, w: 320, h: 199, target: 'sala', spawn: { x: 750, y: 245, dir: 'down' }, label: 'Voltar para a sala' }
    ]
  },

  lobby: {
    image: 'assets/scenes/lobby_2_andar.jpg',
    playerScale: 0.145,
    spawn: { x: 770, y: 620, dir: 'up' },
    walkable: [
      [75, 250, 1380, 440],
      [620, 540, 320, 265]
    ],
    blocked: [
      [335, 105, 310, 160],                   // aparador esquerdo
      [975, 135, 155, 190],                   // planta
      [1330, 260, 140, 340],                  // console direita
      [500, 505, 150, 95],                    // corrimão esquerdo
      [900, 505, 155, 95]                     // corrimão direito
    ],
    doors: [
      { x: 145, y: 55, w: 190, h: 230, target: 'quarto_protagonista', spawn: { x: 770, y: 700, dir: 'up' }, label: 'Entrar no antigo quarto' },
      { x: 650, y: 45, w: 205, h: 245, target: 'quarto_pai', spawn: { x: 770, y: 700, dir: 'up' }, label: 'Entrar no quarto do pai' },
      { x: 1180, y: 55, w: 190, h: 230, action: 'unavailable', label: 'Banheiro' },
      { x: 620, y: 525, w: 325, h: 260, target: 'sala', spawn: { x: 1350, y: 555, dir: 'left' }, label: 'Descer para a sala' }
    ]
  },

  quarto_pai: {
    image: 'assets/scenes/quarto_pai.jpg',
    playerScale: 0.145,
    spawn: { x: 770, y: 700, dir: 'up' },
    walkable: [
      [120, 310, 1270, 430],
      [610, 635, 335, 229]
    ],
    blocked: [
      [300, 30, 350, 335],                    // guarda-roupa
      [660, 165, 145, 175],                   // criado-mudo
      [775, 150, 455, 475],                   // cama
      [235, 320, 200, 205],                   // cadeira
      [115, 420, 230, 305],                   // gaveteiro
      [1240, 470, 175, 275],                  // ventilador
      [1245, 125, 145, 205]                   // planta
    ],
    doors: [
      { x: 610, y: 625, w: 340, h: 239, target: 'lobby', spawn: { x: 760, y: 320, dir: 'down' }, label: 'Voltar ao corredor' }
    ]
  },

  quarto_protagonista: {
    image: 'assets/scenes/quarto_protagonista.jpg',
    playerScale: 0.145,
    spawn: { x: 770, y: 700, dir: 'up' },
    walkable: [
      [120, 320, 1270, 410],
      [610, 630, 335, 234]
    ],
    blocked: [
      [170, 120, 395, 510],                   // cama antiga
      [575, 105, 415, 265],                   // escrivaninha
      [650, 245, 190, 205],                   // cadeira
      [1010, 70, 275, 350],                   // estante
      [1160, 250, 185, 240],                  // violão
      [1165, 470, 235, 210],                  // caixa de pertences
      [115, 500, 235, 185],                   // criado/dresser esquerdo
      [260, 570, 100, 130]                    // mochila
    ],
    doors: [
      { x: 610, y: 620, w: 340, h: 244, target: 'lobby', spawn: { x: 245, y: 320, dir: 'down' }, label: 'Voltar ao corredor' }
    ]
  }
};
