# Coisas que Ficam — protótipo web

Protótipo em **HTML + CSS + JavaScript puro**, preparado para GitHub Pages. Não usa framework nem servidor.

## Como jogar

- **WASD** ou **setas**: andar
- **E** ou **Espaço**: abrir/entrar por portas e passagens
- No celular aparecem controles virtuais.

O protótipo começa do lado de fora da casa. O portão usa os dois frames fornecidos (fechado/aberto). Depois é possível entrar na sala e circular entre os ambientes já ilustrados.

## Ambientes incluídos

- Exterior — portão fechado
- Exterior — portão aberto
- Sala
- Cozinha + área de serviço
- Quintal dos fundos
- Lobby do segundo andar
- Quarto do pai
- Antigo quarto do protagonista

O banheiro aparece nas imagens, mas ainda não possui frame próprio; por isso a porta informa que o cômodo ainda não foi adicionado.

## Colisões

As colisões foram desenhadas manualmente sobre os cenários para que o personagem não atravesse sofá, mesas, cama, armários, bancadas, plantas grandes etc.

Para facilitar ajustes finos depois:

- **F2**: mostra/esconde as áreas de colisão, regiões caminháveis e portas.
- **F3**: mostra as coordenadas do mouse no sistema 1536×864.

Todas as coordenadas ficam em `js/scenes.js`, separadas por ambiente. Assim é possível corrigir um obstáculo sem mexer na engine.

## Publicar no GitHub Pages

1. Envie **todo o conteúdo desta pasta** para a raiz do repositório.
2. No GitHub, abra **Settings → Pages**.
3. Em *Build and deployment*, escolha **Deploy from a branch**.
4. Selecione `main` e `/ (root)`.
5. Salve.

Não é necessário `npm install`, build ou backend.

## Estrutura

```text
/
├── index.html
├── styles.css
├── README.md
├── js/
│   ├── scenes.js   # mapas, portas, spawns e colisões
│   └── game.js     # movimento, animação, transições e controles
└── assets/
    ├── scenes/     # imagens dos ambientes
    └── player/     # frames de caminhada em 4 direções
```

## Próxima etapa sugerida

Quando as interações narrativas forem adicionadas, mantenha `game.js` como motor e acrescente em `scenes.js` uma lista de objetos interativos por ambiente. Isso permite preservar as colisões atuais e adicionar memórias, textos e efeitos sem reestruturar a movimentação.
