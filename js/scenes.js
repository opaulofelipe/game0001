/*
 * Coordenadas no espaço original das imagens: 1536 x 864.
 *
 * F2: mostra áreas caminháveis, colisões e gatilhos.
 * F3: mostra a coordenada do mouse.
 *
 * blocked: [x, y, largura, altura]
 * walkable: regiões onde os PÉS do personagem podem estar.
 * doors: áreas de interação; "radius" aumenta a tolerância sem alterar a colisão.
 */

window.SCENES = {
  exterior_fechado: {
    image: 'assets/scenes/exterior_fechado.jpg',
    playerScale: 0.15,
    interactionRadius: 82,
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
      { x: 700, y: 515, w: 140, h: 120, radius: 90, action: 'openGate', label: 'Abrir o portão' }
    ]
  },

  exterior_aberto: {
    image: 'assets/scenes/exterior_aberto.jpg',
    playerScale: 0.15,
    interactionRadius: 86,
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
      { x: 690, y: 235, w: 165, h: 170, radius: 100, target: 'sala', spawn: { x: 770, y: 700, dir: 'up' }, label: 'Entrar na casa' }
    ]
  },

  sala: {
    image: 'assets/scenes/sala.jpg',
    playerScale: 0.145,
    interactionRadius: 92,
    playerCollider: { w: 23, h: 12 },
    spawn: { x: 775, y: 695, dir: 'up' },

    // A faixa da direita agora acompanha a nova imagem da sala:
    // o personagem consegue entrar na escada, caminhar por ela e chegar ao topo.
    walkable: [
      [42, 48, 1210, 635],
      [615, 615, 385, 249],
      [1175, 250, 361, 500],
      [1280, 45, 256, 819]
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

      // sofá — permanece de frente para a TV
      [605, 270, 170, 315],

      // estante superior
      [340, 70, 260, 165],

      // aparador / decoração superior centro-direita
      [790, 80, 220, 150],
      [985, 120, 95, 155],

      // console e plantas ao lado da escada.
      // Não invade mais a faixa caminhável dos degraus.
      [1170, 320, 80, 205],
      [1170, 545, 80, 80],

      // paredes laterais da entrada inferior
      [0, 675, 610, 189],
      [985, 675, 280, 189]
    ],

    doors: [
      // Gatilho propositalmente mais largo que a arte da porta.
      // Isso corrige o problema de a porta da cozinha não responder ao E.
      {
        x: 95, y: 35, w: 225, h: 230, radius: 118,
        target: 'cozinha',
        spawn: { x: 250, y: 755, dir: 'up' },
        label: 'Entrar na cozinha'
      },

      {
        x: 660, y: 35, w: 190, h: 225, radius: 105,
        target: 'quintal',
        spawn: { x: 770, y: 765, dir: 'up' },
        label: 'Ir ao quintal'
      },

      {
        x: 1020, y: 65, w: 175, h: 215, radius: 95,
        action: 'unavailable',
        label: 'Banheiro'
      },

      // O gatilho fica no ALTO da escada. O jogador precisa caminhar pelos
      // degraus antes da transição para o lobby do segundo andar.
      {
        x: 1280, y: 35, w: 256, h: 205, radius: 88,
        target: 'lobby',
        spawn: { x: 770, y: 625, dir: 'up' },
        label: 'Subir para o segundo andar'
      },

      {
        x: 680, y: 620, w: 190, h: 220, radius: 90,
        target: 'exterior_aberto',
        spawn: { x: 768, y: 395, dir: 'down' },
        label: 'Sair da casa'
      }
    ]
  },

  cozinha: {
    image: 'assets/scenes/cozinha.jpg',
    playerScale: 0.145,
    interactionRadius: 100,
    playerCollider: { w: 23, h: 12 },
    spawn: { x: 250, y: 755, dir: 'up' },

    walkable: [
      [25, 300, 1115, 525],
      [1200, 320, 300, 460],
      [120, 690, 300, 174]
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
      [0, 790, 120, 74],
      [420, 790, 1116, 74]
    ],

    doors: [
      {
        x: 110, y: 680, w: 320, h: 184, radius: 125,
        target: 'sala',
        spawn: { x: 205, y: 255, dir: 'down' },
        label: 'Voltar para a sala'
      }
    ]
  },

  quintal: {
    image: 'assets/scenes/quintal.jpg',
    playerScale: 0.145,
    interactionRadius: 92,
    spawn: { x: 770, y: 750, dir: 'up' },
    walkable: [
      [165, 245, 1195, 500],
      [630, 675, 285, 189]
    ],
    blocked: [
      [0, 0, 465, 365],
      [255, 195, 440, 395],
      [625, 35, 330, 245],
      [950, 60, 300, 250],
      [1240, 280, 275, 385],
      [0, 285, 185, 470],
      [510, 630, 150, 130],
      [885, 630, 155, 130]
    ],
    doors: [
      {
        x: 625, y: 665, w: 320, h: 199, radius: 100,
        target: 'sala',
        spawn: { x: 750, y: 245, dir: 'down' },
        label: 'Voltar para a sala'
      }
    ]
  },

  lobby: {
    image: 'assets/scenes/lobby_2_andar.jpg',
    playerScale: 0.145,
    interactionRadius: 92,
    spawn: { x: 770, y: 620, dir: 'up' },
    walkable: [
      [75, 250, 1380, 440],
      [620, 540, 320, 265]
    ],
    blocked: [
      [335, 105, 310, 160],
      [975, 135, 155, 190],
      [1330, 260, 140, 340],
      [500, 505, 150, 95],
      [900, 505, 155, 95]
    ],
    doors: [
      {
        x: 145, y: 55, w: 190, h: 230, radius: 95,
        target: 'quarto_protagonista',
        spawn: { x: 770, y: 700, dir: 'up' },
        label: 'Entrar no antigo quarto'
      },
      {
        x: 650, y: 45, w: 205, h: 245, radius: 95,
        target: 'quarto_pai',
        spawn: { x: 770, y: 700, dir: 'up' },
        label: 'Entrar no quarto do pai'
      },
      {
        x: 1180, y: 55, w: 190, h: 230, radius: 95,
        action: 'unavailable',
        label: 'Banheiro'
      },
      {
        x: 600, y: 515, w: 365, h: 300, radius: 105,
        target: 'sala',
        spawn: { x: 1395, y: 690, dir: 'down' },
        label: 'Descer para a sala'
      }
    ]
  },

  quarto_pai: {
    image: 'assets/scenes/quarto_pai.jpg',
    playerScale: 0.145,
    interactionRadius: 92,
    spawn: { x: 770, y: 700, dir: 'up' },
    walkable: [
      [120, 310, 1270, 430],
      [610, 635, 335, 229]
    ],
    blocked: [
      [300, 30, 350, 335],
      [660, 165, 145, 175],
      [775, 150, 455, 475],
      [235, 320, 200, 205],
      [115, 420, 230, 305],
      [1240, 470, 175, 275],
      [1245, 125, 145, 205]
    ],
    doors: [
      {
        x: 610, y: 625, w: 340, h: 239, radius: 100,
        target: 'lobby',
        spawn: { x: 760, y: 320, dir: 'down' },
        label: 'Voltar ao corredor'
      }
    ]
  },

  quarto_protagonista: {
    image: 'assets/scenes/quarto_protagonista.jpg',
    playerScale: 0.145,
    interactionRadius: 92,
    spawn: { x: 770, y: 700, dir: 'up' },
    walkable: [
      [120, 320, 1270, 410],
      [610, 630, 335, 234]
    ],
    blocked: [
      [170, 120, 395, 510],
      [575, 105, 415, 265],
      [650, 245, 190, 205],
      [1010, 70, 275, 350],
      [1160, 250, 185, 240],
      [1165, 470, 235, 210],
      [115, 500, 235, 185],
      [260, 570, 100, 130]
    ],
    doors: [
      {
        x: 610, y: 620, w: 340, h: 244, radius: 100,
        target: 'lobby',
        spawn: { x: 245, y: 320, dir: 'down' },
        label: 'Voltar ao corredor'
      }
    ]
  }
};