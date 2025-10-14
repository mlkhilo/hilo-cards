// ----- Constantes Globais do Jogo -----
const MAX_PV = 40;
const DECK_SIZE = 20;
const MAX_HAND_SIZE = 8;
const BOT_DIFFICULTIES = ['Médio', 'Difícil', 'Impossível'];

// ----- Definição de Cartas -----
const CARD_POOL = {
    // Básicas
    espadachim: { id:'espadachim', name:'Espadachim', type:'basic', category: 'creature', cost:1, desc:'Causa 2 de dano.', art:'⚔️', image: 'espadachim.png', play: ({ctx})=>dealDamage(ctx,2) },
    escudo: { id:'escudo', name:'Escudo de Madeira', type:'basic', category: 'effect', cost:1, desc:'Ganha 2 de escudo.', art:'🛡️', image: 'escudodemadeira.png' ,play: ({ctx})=>gainShield(ctx.player,2) },
    flecha: { id:'flecha', name:'Flecha Rápida', type:'basic', category: 'effect', cost:0, desc:'Causa 1 de dano.', art:'🏹',image: 'flecharapida.png' , play: ({ctx})=>dealDamage(ctx,1) },
    pocao: { id:'pocao', name:'Poção Menor', type:'basic', category: 'effect', cost:1, desc:'Cura 2 PV.', art:'🧪', image: 'curamenor.png', play: ({ctx})=>heal(ctx.player,2) },
    martelo: { id:'martelo', name:'Martelo de Pedra', type:'basic', category: 'effect', cost:2, desc:'Causa 3 de dano.', art:'🔨', image: 'martelodepedra.png', play: ({ctx})=>dealDamage(ctx,3) },
    arqueiro: { id:'arqueiro', name:'Arqueiro', type:'basic', category: 'creature', cost:2, desc:'2 de dano, ignora 1 de defesa.', art:'🎯', image: 'arqueiro.png', play: ({ctx})=>dealDamage(ctx,2, {ignoreDef:1}) },
    goblin: { id:'goblin', name:'Goblin Saqueador', type:'basic', category: 'creature', cost:1, desc:'Causa 3 de dano direto.', art:'👺', image: 'goblinsa.png', play: ({ctx})=>dealDamage(ctx,3) },
  
    // Raras
    mago: { id:'mago', name:'Mago Aprendiz', type:'rare', category: 'creature', cost:2, desc:'Causa 4 de dano.', art:'🧙', image: 'magoaprendiz.png', play: ({ctx})=>dealDamage(ctx,4) },
    barreira: { id:'barreira', name:'Barreira de Pedra', type:'rare', category: 'effect', cost:2, desc:'Ganha 5 de escudo.', art:'🧱', image: 'barreiradepedra.png', play: ({ctx})=>gainShield(ctx.player,5) },
    lamina: { id:'lamina', name:'Lâmina Flamejante', type:'rare', category: 'effect', cost:2, desc:'3 de dano, ignora toda a defesa.', art:'🔥', image: 'laminaflamejante.png', play: ({ctx})=>dealDamage(ctx,3, {ignoreDef:999}) },
    pocaoM: { id:'pocaoM', name:'Poção Maior', type:'rare', category: 'effect', cost:2, desc:'Cura 5 PV.', art:'💖', image: 'curamaior.png', play: ({ctx})=>heal(ctx.player,5) },
    cacador: { id:'cacador', name:'Caçador Sombrio', type:'rare', category: 'creature', cost:2, desc:'Causa 2 de dano e te dá 1 de energia.',  art:'🦇', image: 'cacadorsombrio.png', play: async ({ctx})=>{
        await dealDamage(ctx,2);
        log('Caçador Sombrio ativou seu efeito!');
        state[ctx.player].energy = Math.min(7, state[ctx.player].energy + 1);
        updateUI();
    }},
  
    // Lendárias
    dragao: { id:'dragao', name:'Dragão Ancestral', type:'legend', category: 'creature', cost:5, desc:'Causa 10 de dano.', image: 'dragaoancestral.png', art:'🐲', play: ({ctx})=>dealDamage(ctx,10) },
    cavaleiro: { id:'cavaleiro', name:'Cavaleiro Imortal', type:'legend', category: 'creature', cost:6, desc:'Causa 6 de dano e cura 3 de vida.', art:'👻', image: 'cavaleiroimortal.png', play: async ({ctx})=>{
        await dealDamage(ctx,6);
        heal(ctx.player,3);
    }},
    tempestade: { id:'tempestade', name:'Tempestade Arcana', type:'legend', category: 'effect', cost:4, desc:'Causa 3 de dano e aplica 2 turnos de Sangramento (1 de dano por turno).', art:'🌪️', image: 'tempestadearcana.png', play: async ({ctx})=>{
        await dealDamage(ctx,3);
        applyEffect(ctx.opponent, {key:'bleed', turns:3, damage:1});
    }},
    espadaDivina: { id:'espadaDivina', name:'Espada Divina', type:'legend', category: 'effect', cost:3, desc:'Dobra o dano da próxima carta de ataque nos próximos 2 turnos.', art:'✨', image: 'espadadivina.png', play: ({ctx})=>applyEffect(ctx.player, {key:'doubleNextAttack',turns:2}) },
    feiticeira: { id: 'feiticeira', name: 'Feiticeira da Lua', type: 'legend', category: 'creature', cost: 3, desc: 'Recupera 3 de PV e ganha 2 de energia.', art: '🌙', image: 'feiticeiradalua.png', play: ({ctx}) => {
        heal(ctx.player, 3);
        state[ctx.player].energy = Math.min(7, state[ctx.player].energy + 2);
        log(`${state[ctx.player].name} sente a energia da lua!`);
    }},

    // Sombria
    crupiesombrio: {
        id: 'crupiesombrio', name: 'Crupie Sombrio', type: 'sombria', category: 'creature', cost: 4, 
        desc: 'Rouba TODA a energia do inimigo e cura o dobro do valor roubado em PV.',
        art: '🎭', image: 'crupiesombrio.png',
        play: ({ ctx }) => {
            const opponent = state[ctx.opponent];
            const energyStolen = opponent.energy;
            if (energyStolen > 0) {
                opponent.energy = 0;
                const healthGained = energyStolen * 2;
                heal(ctx.player, healthGained);
                log(`${state[ctx.player].name} usou o Crupie Sombrio, roubando ${energyStolen} de energia e curando ${healthGained} PV!`);
            } else {
                log('O Crupie Sombrio não encontrou energia para roubar.');
            }
            updateUI();
        }
    },
    pactosombrio: {
        id: 'pactosombrio', name: 'Pacto Sombrio', type: 'sombria', category: 'effect', cost: 5,
        desc: 'Perca 7 PV. Oponente descarta 2 cartas. Escolha 1 carta do seu baralho e compre-a.',
        art: '💀', image: 'pactosombrio.png',
        play: async ({ ctx }) => { // Função agora é assíncrona
            const player = state[ctx.player];
            const opponent = state[ctx.opponent];

            // 1. Perder 7 PV
            log(`${player.name} fez um pacto e perdeu 7 PV.`);
            player.pv -= 7;
            const playerAvatarId = (gameMode === 'vs-player' && ctx.player === state.active) ? 'bottom-player-avatar' : (ctx.player === 'p1' ? 'bottom-player-avatar' : 'top-player-avatar');
            showDamageIndicator(7, document.getElementById(playerAvatarId));
            if (checkWin()) return;

            // 2. Oponente descarta 2 cartas
            for (let i = 0; i < 2; i++) {
                if (opponent.hand.length > 0) {
                    const randomIndex = Math.floor(Math.random() * opponent.hand.length);
                    const discardedCard = opponent.hand.splice(randomIndex, 1)[0];
                    opponent.discard.push(discardedCard);
                    log(`${opponent.name} teve a carta ${discardedCard.name} descartada aleatoriamente!`);
                } else {
                    log(`${opponent.name} não tinha cartas para descartar.`);
                    break;
                }
            }

            // 3. Escolher e Comprar 1 carta
            if (player.deck.length > 0) {
                log(`${player.name} está escolhendo uma carta do baralho...`);
                updateUI();
                const chosenCard = await promptCardChoiceFromDeck(ctx.player);
                if (chosenCard) {
                    log(`${player.name} escolheu e comprou ${chosenCard.name}!`);
                }
            } else {
                log("Não há cartas no baralho para escolher.");
            }
            
            updateUI();
        }
    },

    // Jokers
    jokerRed: { id:'jokerRed', name:'Joker Vermelho', type:'joker', category: 'joker', cost:2, desc:'Multiplica por 2 todo o dano neste turno.', art:'🔴', image: 'jokervermelho.png', play: ({ctx})=>applyEffect(ctx.player, {key:'doubleAllDamage',turns:1}) },
    jokerBlue: { id:'jokerBlue', name:'Joker Azul', type:'joker', category: 'joker', cost:1, desc:'Defesas também curam 2 PV neste turno.', art:'🔵', image: 'jokerazul.png', play: ({ctx})=>applyEffect(ctx.player, {key:'defHeal',turns:1}) },
    jokerGreen: { id:'jokerGreen', name:'Joker Verde', type:'joker', category: 'joker', cost:3, desc:'Permite comprar 2 cartas.', art:'🟢', image: 'jokerverde.png', play: ({ctx})=>{ drawCard(ctx.player); drawCard(ctx.player); } },
    jokerGold: { id:'jokerGold', name:'Joker Dourado', type:'joker', category: 'joker', cost:1, desc:'Revive 1 carta do descarte para a mão.', art:'🟡', image: 'jokerdourado.png', play: ({ctx})=>reviveFromDiscard(ctx) }
  };
  
  // ----- Estado do Jogo -----
  let state = null;
  let gameMode = 'vs-bot';
  let player1CustomDeck = [];
  let player2CustomDeck = [];
  let currentDeckBuilderFor = 'p1';
  let deckBuilderFilters = { rarity: 'all', category: 'all', cost: 'all' };
  let isCrupieSombrioUnlocked = false;
  let eventState = { isActive: false, stage: 0 };


  function getOpponent(playerKey) {
    return playerKey === 'p1' ? 'p2' : 'p1';
  }

  function newGame() {
    let p1Name = 'Jogador';
    let p2Name = 'Inimigo';
    let p2Deck = shuffle(buildStarterDeck());

    if (gameMode === 'vs-player') {
        p1Name = state.p1.name;
        p2Name = state.p2.name;
        p2Deck = shuffle(player2CustomDeck);
    } else if (gameMode === 'event') {
        p1Name = state.p1.name;
        p2Name = `Bot ${BOT_DIFFICULTIES[eventState.stage]}`;
    } else { // vs-bot
        p1Name = state.p1.name;
    }

    state = {
      turn: 1,
      active: 'p1',
      p1: { id: 'p1', name: p1Name, pv: MAX_PV, deck: shuffle(player1CustomDeck), hand: [], discard: [], energy: 0, shield: 0 },
      p2: { id: 'p2', name: p2Name, pv: MAX_PV, deck: p2Deck, hand: [], discard: [], energy: 0, shield: 0 },
      activeEffects: [],
      log: [],
      gameEnded: false,
      playedCards: [],
      undoStack: []
    };
    for(let i=0; i<5; i++) { drawCard('p1'); drawCard('p2'); }
    startTurn('p1');
  }
  
  function buildStarterDeck() {
    const deck = [];
    const add = (id, n) => { for(let i=0; i<n; i++) deck.push(CARD_POOL[id]) };
    add('espadachim', 3); add('escudo', 2); add('flecha', 2); add('pocao', 2);
    add('martelo', 2); add('arqueiro', 2); add('goblin', 2); add('mago', 2);
    add('barreira', 1); add('lamina', 1);
    return deck;
  }
  
  // ----- Lógica do Jogo -----
  function shuffle(a) { return a.slice().sort(() => Math.random() - 0.5); }
  
  function drawCard(who) {
      const p = state[who];
      if (p.hand.length >= MAX_HAND_SIZE) {
          log(`${p.name} tem a mão cheia! A carta comprada foi para o descarte.`);
          if (p.deck.length > 0) {
              const discardedCard = p.deck.shift();
              p.discard.push(discardedCard);
          }
          updateUI();
          return null;
      }
      if (p.deck.length === 0) {
          if(p.discard.length > 0) {
              log(`${p.name} ficou sem cartas! Reembaralhando o descarte.`);
              p.deck = shuffle(p.discard);
              p.discard = [];
          } else {
              log(`${p.name} não tem cartas! Perde 2 PV.`);
              p.pv -= 2;
              const avatarId = (gameMode === 'vs-player' && who === state.active) ? 'bottom-player-avatar' : (who === 'p1' ? 'bottom-player-avatar' : 'top-player-avatar');
              showDamageIndicator(2, document.getElementById(avatarId));
              checkWin();
              updateUI();
              return null;
          }
      }
      const card = p.deck.shift();
      p.hand.push(card);
      updateUI();
      return card;
  }
  
  function log(msg) {
    if (!state) return;
    state.log.unshift(`[T${state.turn}] ${msg}`);
    if(state.log.length > 50) state.log.pop();
    updateUI();
  }
  
  function startTurn(who) {
      if (state.gameEnded) return;
      state.active = who;
      if(gameMode === 'vs-player' && state.active !== 'p1'){
        const transitionScreen = document.getElementById('turn-transition-screen');
        document.getElementById('transition-title').textContent = `Vez do ${state[who].name}`;
        transitionScreen.classList.remove('hidden');
        document.getElementById('transition-continue-btn').onclick = () => {
            transitionScreen.classList.add('hidden');
            executeTurnStart(who);
        };
      } else {
        executeTurnStart(who);
      }
  }

  function executeTurnStart(who) {
    const p = state[who];
    const isHumanTurn = (gameMode !== 'vs-player' && who === 'p1') || gameMode === 'vs-player';
    if (isHumanTurn) {
        state.playedCards = [];
        state.undoStack = [];
        document.getElementById('end-turn').disabled = false;
        document.getElementById('undo-move').disabled = true;
    }
    p.shield = 0;
    p.energy = Math.min(7, p.energy + 3);
    // Bônus para o Bot Impossível do Evento
    if (gameMode === 'event' && who === 'p2' && eventState.stage === 2) {
        p.energy = Math.min(7, p.energy + 1);
        log('A presença do Bot Impossível gera +1 de Energia extra!');
    }
    log(`${p.name} começou o turno e ganhou +3 de Energia.`);
    state.activeEffects = state.activeEffects.filter(eff => {
        if (eff.owner === who) {
            if (eff.key === 'bleed' && eff.turns > 1) {
                log(`${p.name} sofre ${eff.damage} de dano de Sangramento.`);
                p.pv -= eff.damage || 1;
                const avatarId = (gameMode === 'vs-player' && who === state.active) ? 'bottom-player-avatar' : (who === 'p1' ? 'bottom-player-avatar' : 'top-player-avatar');
                showDamageIndicator(eff.damage || 1, document.getElementById(avatarId));
                if (checkWin()) return false;
            }
            eff.turns--;
            if (eff.turns <= 0) {
                log(`Efeito '${eff.key}' expirou para ${p.name}.`);
                return false;
            }
        }
        return true;
    });
    drawCard(who);
    updateUI();
    if ((gameMode === 'vs-bot' || gameMode === 'event') && who === 'p2') {
        setTimeout(enemyAI, 1000);
    }
  }
  
  function endTurn() {
      const activePlayer = state.active;
      const opponent = getOpponent(activePlayer);
      if (state.active === 'p1' || (state.active === 'p2' && gameMode === 'vs-player')) {
          document.getElementById('end-turn').disabled = true;
      }
      log(`${state[activePlayer].name} terminou seu turno.`);
      state[activePlayer].discard.push(...state.playedCards);
      if(activePlayer === 'p2') {
        state.turn++;
      }
      state.playedCards = [];
      startTurn(opponent);
  }

  function undoMove() {
      if (state.gameEnded || state.undoStack.length === 0) return;
      const lastMove = state.undoStack.pop();
      const p = state[state.active];
      const opponent = state[getOpponent(state.active)];
      p.energy = lastMove.prevEnergy;
      p.pv = lastMove.prevPV;
      p.shield = lastMove.prevShield;
      p.deck = lastMove.prevDeck;
      p.discard = lastMove.prevDiscard;
      p.hand = lastMove.prevHand;
      opponent.pv = lastMove.prevOpponentPV;
      opponent.shield = lastMove.prevOpponentShield;
      const cardToReturn = state.playedCards.pop();
      if (cardToReturn) {
          log(`Retornada a jogada de ${cardToReturn.name}.`);
      }
      document.getElementById('undo-move').disabled = state.undoStack.length === 0; 
      updateUI();
  }
  
  async function playCard(handIdx) {
      if (state.gameEnded) return;
      const p = state[state.active];
      const card = p.hand[handIdx];
      if (!card || card.cost > p.energy) return;
      state.undoStack.push({
          prevEnergy: p.energy,
          prevPV: p.pv,
          prevShield: p.shield,
          prevDeck: p.deck.slice(),
          prevDiscard: p.discard.slice(),
          prevHand: p.hand.slice(),
          prevOpponentPV: state[getOpponent(state.active)].pv,
          prevOpponentShield: state[getOpponent(state.active)].shield,
          cardId: card.id
      });
      p.energy -= card.cost;
      const playedCard = p.hand.splice(handIdx, 1)[0];
      log(`${p.name} jogou ${card.name}.`);
      const context = { ctx: { player: state.active, opponent: getOpponent(state.active) } };
      state.playedCards.push(playedCard);
      document.getElementById('undo-move').disabled = false;
      
      // A carta é jogada e seu efeito é resolvido aqui
      await card.play(context);
      
      // A UI é atualizada após a conclusão do efeito
      updateUI();
  }
  
    // ----- IA do Inimigo com Dificuldades -----
    async function playCardAsBot(handIdx) {
        const p = state.p2;
        const card = p.hand[handIdx];
        if (!card || card.cost > p.energy) return;
        p.energy -= card.cost;
        const playedCard = p.hand.splice(handIdx, 1)[0];
        log(`Inimigo jogou ${card.name}.`);
        const context = { ctx: { player: 'p2', opponent: 'p1' } };
        state.playedCards.push(playedCard);
        await card.play(context);
        updateUI();
    }

    async function enemyAI() {
        if (state.gameEnded) return;

        let difficulty = 'easy'; // Padrão para vs-bot normal
        if (gameMode === 'event' && eventState.isActive) {
            difficulty = BOT_DIFFICULTIES[eventState.stage].toLowerCase();
        }

        const getPlayable = () => state.p2.hand.map((c, i) => ({ card: c, index: i }))
            .filter(item => item.card.cost <= state.p2.energy)
            .sort((a, b) => b.card.cost - a.card.cost); // Prioriza cartas mais caras

        let playable = getPlayable();
        if (playable.length > 0) {
            let move;
            if (difficulty === 'impossível' || difficulty === 'difícil') {
                // Estratégia Difícil/Impossível: mais inteligente
                const healCards = playable.filter(m => ['pocao', 'pocaoM', 'feiticeira', 'cavaleiro', 'crupiesombrio'].includes(m.card.id));
                const damageCards = playable.filter(m => CARD_POOL[m.card.id].play.toString().includes('dealDamage'));

                if (state.p2.pv < 15 && healCards.length > 0) {
                    move = healCards[0]; // Cura se estiver com vida baixa
                } else if (state.p1.pv < 10 && damageCards.length > 0) {
                    move = damageCards.sort((a,b) => (b.card.cost*2) - a.card.cost)[0]; // Tenta finalizar
                } else {
                    move = playable[0]; // Joga a carta mais cara que puder
                }
            } else if (difficulty === 'médio') {
                // Estratégia Média: prioriza dano
                 const damageCards = playable.filter(m => CARD_POOL[m.card.id].play.toString().includes('dealDamage'));
                 move = damageCards.length > 0 ? damageCards[0] : playable[0];
            } else {
                // Estratégia Fácil (original)
                move = playable.sort(() => Math.random() - 0.5)[0];
            }
            
            await playCardAsBot(move.index);
            setTimeout(() => enemyAI(), 1200); // Tenta jogar outra carta
        } else {
            setTimeout(endTurn, 700); // Termina o turno se não houver jogadas
        }
    }
  
  // ----- Efeitos das Cartas -----
  async function dealDamage(ctx, amount, opts = {}) {
    const defender = state[ctx.opponent];
    let dmg = amount;
    if(hasEffect(ctx.player,'doubleAllDamage')) dmg *= 2;
    if(hasEffect(ctx.player,'doubleNextAttack')){ dmg *= 2; removeEffect(ctx.player,'doubleNextAttack'); }
    let ignoredShield = opts.ignoreDef ? Math.min(defender.shield, opts.ignoreDef) : 0;
    const shieldBlock = Math.max(0, defender.shield - ignoredShield);
    const finalDamage = Math.max(0, dmg - shieldBlock);
    defender.shield = Math.max(0, defender.shield - dmg);
    defender.pv -= finalDamage;
    log(`${state[ctx.player].name} causou ${dmg} de dano a ${defender.name}. ${shieldBlock} bloqueado.`);
    const targetPlayerKey = ctx.opponent;
    let targetAvatarId = '';
    if (gameMode === 'vs-bot' || gameMode === 'event') {
        targetAvatarId = targetPlayerKey === 'p1' ? 'bottom-player-avatar' : 'top-player-avatar';
    } else {
        targetAvatarId = state.active === targetPlayerKey ? 'bottom-player-avatar' : 'top-player-avatar';
    }
    showDamageIndicator(finalDamage, document.getElementById(targetAvatarId));
    updateUI();
    await new Promise(resolve => setTimeout(resolve, 300));
    checkWin();
    return defender.pv <= 0;
  }
  
  function gainShield(who, amount) {
      const p = state[who];
      if (hasEffect(who, 'defHeal')) heal(who, 2);
      p.shield += amount;
      log(`${p.name} ganhou ${amount} de escudo.`);
      updateUI();
  }
  
  function heal(who, amount) {
      const p = state[who];
      p.pv = Math.min(MAX_PV, p.pv + amount);
      log(`${p.name} recuperou ${amount} PV.`);
      updateUI();
  }
  
  function applyEffect(playerKey, effect) {
      state.activeEffects.push({ owner: playerKey, ...effect });
      log(`${state[playerKey].name} ativou o efeito: ${effect.key}.`);
      updateUI();
  }
  
  function hasEffect(playerKey, key) { return state.activeEffects.some(e => e.owner === playerKey && e.key === key); }
  function removeEffect(playerKey, key) {
      const idx = state.activeEffects.findIndex(e => e.owner === playerKey && e.key === key);
      if(idx >= 0) state.activeEffects.splice(idx, 1);
  }
  
  function reviveFromDiscard(ctx) {
      const p = state[ctx.player];
      if (p.discard.length === 0) { 
          log('Descarte vazio.'); 
          return; 
      }
      if (p.hand.length >= MAX_HAND_SIZE) {
          log(`${p.name} não pode reviver pois a mão está cheia!`);
          updateUI();
          return;
      }
      const revivedCard = p.discard.pop();
      p.hand.push(revivedCard);
      log(`${p.name} reviveu ${revivedCard.name} do descarte.`);
      updateUI();
  }
  
  function checkWin() {
    if (state.gameEnded) return true;
    if (state.p1.pv <= 0 || state.p2.pv <= 0) {
        state.gameEnded = true;
        const winner = state.p1.pv > 0 ? state.p1 : state.p2;

        if (gameMode === 'event' && eventState.isActive) {
            handleEventEnd(winner.id === 'p1');
            return true;
        }
        
        setTimeout(() => showVictoryScreen(winner.name), 1000);
        return true;
    }
    return false;
  }
  
  function changePlayerName(playerKey) {
      if (!state || state.gameEnded) return;
      const currentName = state[playerKey].name;
      const newName = prompt(`Digite o novo nome para ${currentName}:`, currentName);
      if (newName && newName.trim() !== '' && newName.length <= 15) {
          state[playerKey].name = newName.trim();
          log(`O nome de ${currentName} foi alterado para ${state[playerKey].name}.`);
          updateUI();
      } else if (newName !== null) {
          alert('Nome inválido. Por favor, insira um nome com até 15 caracteres.');
      }
  }

  // ----- Renderização e UI -----
  function renderCard(card, { isSmall = false } = {}) {
    const el = document.createElement('div');
    el.className = 'card';
    if(isSmall) el.classList.add('small-card');
    el.dataset.id = card.id;
    el.dataset.type = card.type;

    if (card.type === 'sombria') {
        const sideIconContainer = document.createElement('div');
        sideIconContainer.className = 'card-side-icon';
        const sideIconImg = document.createElement('img');
        sideIconImg.src = 'sombrio.png';
        sideIconImg.alt = 'Ícone Sombrio';
        sideIconContainer.appendChild(sideIconImg);
        el.appendChild(sideIconContainer);
    }

    if (card.image) {
      el.classList.add('full-image');
      el.style.backgroundImage = `url('${card.image}')`;
    } else {
      el.innerHTML = `
        <div class="card-header">
          <div class="card-name">${card.name}</div>
          <div class="card-cost">${card.cost}</div>
        </div>
        <div class="card-art">${card.art || ''}</div>
        <div class="card-desc">${card.desc}</div>
        <div class="card-type">${card.type}</div>
      `;
    }
    return el;
  }

  function updateUI() {
    if(!state) return;

    const bottomPlayerKey = (gameMode === 'vs-player' && state.active === 'p2') ? 'p2' : 'p1';
    const topPlayerKey = getOpponent(bottomPlayerKey);
    const bottomP = state[bottomPlayerKey];
    const topP = state[topPlayerKey];

    document.getElementById('bottom-player-name').textContent = bottomP.name;
    document.getElementById('top-player-name').textContent = topP.name;
    document.getElementById('bottom-player-avatar').textContent = bottomPlayerKey === 'p1' ? '😎' : '🤓';
    document.getElementById('top-player-avatar').textContent = topPlayerKey === 'p1' ? '😎' : ((gameMode === 'vs-bot' || gameMode === 'event') ? '🤖' : '🤓');
    
    document.getElementById('edit-bottom-player-name-btn').onclick = () => changePlayerName(bottomPlayerKey);
    document.getElementById('edit-top-player-name-btn').onclick = () => changePlayerName(topPlayerKey);
    document.getElementById('edit-top-player-name-btn').classList.toggle('hidden', gameMode === 'vs-bot' || gameMode === 'event');

    document.getElementById('bottom-player-health-bar').style.width = `${(Math.max(0, bottomP.pv) / MAX_PV) * 100}%`;
    document.getElementById('top-player-health-bar').style.width = `${(Math.max(0, topP.pv) / MAX_PV) * 100}%`;
    
    document.getElementById('bottom-player-pv').textContent = `${bottomP.pv} PV ${bottomP.shield > 0 ? `(+${bottomP.shield}🛡️)`: ''}`;
    document.getElementById('bottom-player-deck').textContent = bottomP.deck.length;
    document.getElementById('bottom-player-discard').textContent = bottomP.discard.length;
    
    document.getElementById('top-player-pv').textContent = `${topP.pv} PV ${topP.shield > 0 ? `(+${topP.shield}🛡️)`: ''}`;
    document.getElementById('top-player-deck').textContent = topP.deck.length;
    document.getElementById('top-player-discard').textContent = topP.discard.length;
    document.getElementById('top-player-energy').textContent = topP.energy;
    
    document.getElementById('top-player-bleed-icon').classList.toggle('hidden', !hasEffect(topPlayerKey, 'bleed'));
    document.getElementById('bottom-player-bleed-icon').classList.toggle('hidden', !hasEffect(bottomPlayerKey, 'bleed'));

    document.getElementById('turn-indicator').textContent = `Turno ${state.turn}`;
    document.getElementById('undo-move').disabled = state.undoStack.length === 0;

    const energyBar = document.getElementById('bottom-player-energy');
    energyBar.innerHTML = '';
    for(let i=0; i<7; i++){
      const orb = document.createElement('div');
      orb.className = `energy-orb ${i < bottomP.energy ? 'filled' : ''}`;
      energyBar.appendChild(orb);
    }
  
    const hand = document.getElementById('hand');
    hand.innerHTML = '';
    bottomP.hand.forEach((card, idx) => {
      const el = renderCard(card);
      if (card.cost <= bottomP.energy) el.classList.add('playable');
      el.onclick = () => playCard(idx);
      
      const infoBtn = document.createElement('button');
      infoBtn.className = 'card-info-btn';
      infoBtn.innerHTML = '🔍';
      infoBtn.onclick = (e) => {
          e.stopPropagation();
          showCardImageModal(card);
      };
      el.appendChild(infoBtn);
      
      hand.appendChild(el);
    });
    
    document.getElementById('hand-counter').textContent = `${bottomP.hand.length}/${MAX_HAND_SIZE}`;
    
    const playedCardsArea = document.getElementById('played-cards');
    playedCardsArea.innerHTML = '';
    state.playedCards.forEach(card => playedCardsArea.appendChild(renderCard(card, { isSmall: true })));

    document.getElementById('log-area').innerHTML = state.log.map(entry => `<div class="log-entry">${entry}</div>`).join('');
  }
  
  function showDamageIndicator(amount, targetElement) {
      if (amount <= 0 || !targetElement) return;
      const indicator = document.createElement('div');
      indicator.className = 'damage-indicator';
      indicator.textContent = `-${amount}`;
      document.body.appendChild(indicator);
      const rect = targetElement.getBoundingClientRect();
      indicator.style.left = `${rect.left + rect.width / 2 - indicator.offsetWidth / 2}px`;
      indicator.style.top = `${rect.top - indicator.offsetHeight}px`;
      setTimeout(() => indicator.remove(), 1500);
  }

  // ----- Funções de Modais -----
  function showCardImageModal(card) {
      if (!card.image) return;
      const modal = document.getElementById('card-image-modal');
      const imgEl = document.getElementById('modal-card-image');
      imgEl.src = card.image;
      modal.classList.remove('hidden');
  }

  function hideCardImageModal() {
      const modal = document.getElementById('card-image-modal');
      modal.classList.add('hidden');
  }

  // ----- Tela de Vitória -----
  function showVictoryScreen(winnerName, subtitle = '') {
      const victoryScreen = document.getElementById('victory-screen');
      const winnerText = document.getElementById('winner-name-text');
      const subtitleText = document.getElementById('victory-subtitle');
      
      winnerText.textContent = `${winnerName} Venceu!`;
      if (subtitle) {
          subtitleText.textContent = subtitle;
          subtitleText.classList.remove('hidden');
      } else {
          subtitleText.classList.add('hidden');
      }
      victoryScreen.classList.remove('hidden');
  }
  
  // ----- Lógica do Deck Builder -----
  function updateDeckBuilderUI() {
    const currentDeck = (currentDeckBuilderFor === 'p1') ? player1CustomDeck : player2CustomDeck;
    const counter = document.getElementById('deck-counter');
    const list = document.getElementById('current-deck-list');
    const startBtn = document.getElementById('start-game-btn');

    counter.textContent = `${currentDeck.length}/${DECK_SIZE}`;
    list.innerHTML = '';

    const cardCounts = currentDeck.reduce((acc, card) => {
        acc[card.id] = (acc[card.id] || 0) + 1;
        return acc;
    }, {});

    Object.keys(cardCounts).sort().forEach(cardId => {
        const card = CARD_POOL[cardId];
        const count = cardCounts[cardId];
        const li = document.createElement('div');
        li.className = 'card-in-deck';
        li.innerHTML = `<span>${card.name} (x${count})</span><button data-card-id="${card.id}">-</button>`;
        list.appendChild(li);
    });

    list.querySelectorAll('button').forEach(button => {
        button.onclick = (e) => removeCardFromDeck(e.target.getAttribute('data-card-id'));
    });

    startBtn.disabled = currentDeck.length !== DECK_SIZE;
  }

  function addCardToDeck(card) {
      const currentDeck = (currentDeckBuilderFor === 'p1') ? player1CustomDeck : player2CustomDeck;
      if (currentDeck.length >= DECK_SIZE) {
          alert(`Você só pode ter ${DECK_SIZE} cartas no seu baralho!`);
          return;
      }
      
      if (card.id === 'pocaoM') {
          const count = currentDeck.filter(c => c.id === 'pocaoM').length;
          if (count >= 4) {
              alert('Você pode ter no máximo 4 cópias da Poção Maior no seu baralho.');
              return;
          }
      }
      
      // Limite de 1 para cartas Sombrias no baralho
      if (card.type === 'sombria') {
          const count = currentDeck.filter(c => c.id === card.id).length;
          if (count >= 1) {
              alert(`Você só pode ter 1 cópia de ${card.name} no seu baralho.`);
              return;
          }
      }

      currentDeck.push(card);
      updateDeckBuilderUI();
  }

  function removeCardFromDeck(cardId) {
      const currentDeck = (currentDeckBuilderFor === 'p1') ? player1CustomDeck : player2CustomDeck;
      const index = currentDeck.findIndex(card => card.id === cardId);
      if (index > -1) {
          currentDeck.splice(index, 1);
          updateDeckBuilderUI();
      }
  }

  function renderFilteredCardPool() {
    const cardPoolEl = document.getElementById('card-pool');
    cardPoolEl.innerHTML = '';
    
    const allCards = Object.values(CARD_POOL);

    const filteredCards = allCards.filter(card => {
        if ((card.id === 'crupiesombrio' || card.id === 'pactosombrio') && !isCrupieSombrioUnlocked && gameMode !== 'event') {
            return false;
        }

        if (deckBuilderFilters.rarity !== 'all' && card.type !== deckBuilderFilters.rarity) return false;
        if (deckBuilderFilters.category !== 'all' && card.category !== deckBuilderFilters.category) return false;
        if (deckBuilderFilters.cost !== 'all') {
            const cost = deckBuilderFilters.cost;
            if (cost === '5+' && card.cost < 5) return false;
            if (cost !== '5+' && card.cost != cost) return false;
        }
        return true;
    });

    filteredCards.forEach(card => {
        const cardEl = renderCard(card);
        cardEl.classList.add('deck-builder-card');
        cardEl.onclick = () => addCardToDeck(card);
        
        const infoBtn = document.createElement('button');
        infoBtn.className = 'card-info-btn';
        infoBtn.innerHTML = '🔍';
        infoBtn.onclick = (e) => {
            e.stopPropagation();
            showCardImageModal(card);
        };
        cardEl.appendChild(infoBtn);

        cardPoolEl.appendChild(cardEl);
    });
  }

  function initializeDeckBuilder() {
      let titleName = '';
      if (gameMode === 'event') {
          titleName = state.p1.name;
      } else {
          titleName = state[currentDeckBuilderFor].name;
      }
      document.getElementById('deck-builder-title').textContent = `Monte o Baralho - ${titleName}`;
      document.getElementById('deck-size-label').textContent = DECK_SIZE;
      
      renderFilteredCardPool();
      updateDeckBuilderUI();
  }

  // ----- LÓGICA: Escolha de Carta -----
  function promptCardChoiceFromDeck(playerKey) {
    return new Promise(resolve => {
        const player = state[playerKey];
        const modal = document.getElementById('deck-choice-modal');
        const cardList = document.getElementById('deck-choice-card-list');
        const confirmBtn = document.getElementById('deck-choice-confirm-btn');

        cardList.innerHTML = '';
        let selectedCardEl = null;
        let selectedCardIndex = -1;

        player.deck.forEach((card, index) => {
            const cardEl = renderCard(card);
            cardEl.dataset.index = index;
            cardEl.onclick = () => {
                if (selectedCardEl) {
                    selectedCardEl.classList.remove('selected');
                }
                selectedCardEl = cardEl;
                selectedCardEl.classList.add('selected');
                selectedCardIndex = parseInt(cardEl.dataset.index);
                confirmBtn.disabled = false;
            };
            cardList.appendChild(cardEl);
        });

        confirmBtn.onclick = () => {
            if (selectedCardIndex === -1) return;

            // Remove a carta do baralho
            const chosenCard = player.deck.splice(selectedCardIndex, 1)[0];
            
            // Adiciona a carta à mão
            if (player.hand.length < MAX_HAND_SIZE) {
                player.hand.push(chosenCard);
            } else {
                log('Mão cheia! A carta escolhida foi para o descarte.');
                player.discard.push(chosenCard);
            }
            
            // Reembaralha o restante do baralho
            player.deck = shuffle(player.deck);

            // Limpa e esconde o modal
            modal.classList.add('hidden');
            confirmBtn.disabled = true;
            selectedCardEl = null;
            selectedCardIndex = -1;

            resolve(chosenCard); // Retorna a carta que foi escolhida
        };

        modal.classList.remove('hidden');
    });
  }
  
  // ----- Lógica do Evento -----
  function handleEventEnd(playerWon) {
    if (playerWon) {
        eventState.stage++;
        if (eventState.stage >= BOT_DIFFICULTIES.length) {
            // Venceu o evento
            localStorage.setItem('hilo_shadow_event_complete', 'true');
            isCrupieSombrioUnlocked = true;
            setTimeout(() => showVictoryScreen('Você', 'EVENTO SOMBRIO CONCLUÍDO! Cartas Sombrias foram desbloqueadas.'), 500);
            eventState = { isActive: false, stage: 0 };
        } else {
            // Passou para o próximo estágio
            alert(`Você venceu! Próximo desafio: Bot ${BOT_DIFFICULTIES[eventState.stage]}`);
            startEventMatch();
        }
    } else {
        // Perdeu o evento
        setTimeout(() => showVictoryScreen(`Bot ${BOT_DIFFICULTIES[eventState.stage]}`, 'DESAFIO FALHOU! Tente novamente.'), 500);
        eventState = { isActive: false, stage: 0 };
    }
  }

  function startEventMatch() {
    player1CustomDeck = [];
    document.querySelector('.game-container').classList.add('hidden');
    document.querySelector('#victory-screen').classList.add('hidden');
    document.querySelector('#deck-builder-screen').classList.remove('hidden');

    gameMode = 'event';
    state = { p1: { name: 'Desafiante' }, p2: { name: `Bot ${BOT_DIFFICULTIES[eventState.stage]}` } };
    initializeDeckBuilder();
  }


  // ----- Início do Jogo e Event Listeners -----
  document.addEventListener('DOMContentLoaded', () => {
    // Variáveis Globais de Elementos
    const gameModeSelectionScreen = document.getElementById('game-mode-selection');
    const playerNameScreen = document.getElementById('player-name-screen');
    const deckBuilderScreen = document.getElementById('deck-builder-screen');
    const gameContainer = document.querySelector('.game-container');
    const cardImageModal = document.getElementById('card-image-modal');
    const eventIntroScreen = document.getElementById('event-intro-screen');
    const eventNotification = document.getElementById('event-notification');
    const closeNotificationBtn = document.getElementById('event-notification-close-btn');

    // Lógica da Notificação de Evento no Início
    isCrupieSombrioUnlocked = localStorage.getItem('hilo_shadow_event_complete') === 'true';
    if (!isCrupieSombrioUnlocked) {
        eventNotification.classList.remove('hidden');
    }
    closeNotificationBtn.onclick = () => {
        eventNotification.classList.add('hidden');
    };

    // Listeners dos Botões de Modo de Jogo
    document.getElementById('vs-bot-btn').onclick = () => {
        gameMode = 'vs-bot';
        currentDeckBuilderFor = 'p1';
        gameModeSelectionScreen.classList.add('hidden');
        deckBuilderScreen.classList.remove('hidden');
        state = { p1: { name: 'Jogador' }, p2: { name: 'Inimigo' } };
        initializeDeckBuilder();
    };
    
    document.getElementById('vs-player-btn').onclick = () => {
        gameModeSelectionScreen.classList.add('hidden');
        playerNameScreen.classList.remove('hidden');
    };

    document.getElementById('event-btn').onclick = () => {
        gameModeSelectionScreen.classList.add('hidden');
        eventIntroScreen.classList.remove('hidden');
    };

    document.getElementById('start-event-btn').onclick = () => {
        eventIntroScreen.classList.add('hidden');
        eventState = { isActive: true, stage: 0 };
        startEventMatch();
    };

    document.getElementById('confirm-names-btn').onclick = () => {
        const p1Name = document.getElementById('p1-name-input').value.trim() || 'Jogador 1';
        const p2Name = document.getElementById('p2-name-input').value.trim() || 'Jogador 2';
        gameMode = 'vs-player';
        currentDeckBuilderFor = 'p1';
        state = { p1: { name: p1Name }, p2: { name: p2Name } };
        playerNameScreen.classList.add('hidden');
        deckBuilderScreen.classList.remove('hidden');
        initializeDeckBuilder();
    };

    // Listeners dos Controles do Jogo
    document.getElementById('end-turn').onclick = endTurn;
    document.getElementById('undo-move').onclick = undoMove;
  
    document.getElementById('start-game-btn').onclick = () => {
        if (gameMode === 'event') {
            const hasCrupie = player1CustomDeck.some(card => card.id === 'crupiesombrio');
            if (!hasCrupie) {
                alert('Você deve incluir a carta "Crupie Sombrio" no seu baralho para iniciar o evento!');
                return;
            }
        }

        const currentDeck = (currentDeckBuilderFor === 'p1') ? player1CustomDeck : player2CustomDeck;
        if (currentDeck.length !== DECK_SIZE) return;

        if (gameMode === 'vs-player' && currentDeckBuilderFor === 'p1') {
            currentDeckBuilderFor = 'p2';
            alert(`Baralho de ${state.p1.name} confirmado! Agora é a vez de ${state.p2.name}.`);
            initializeDeckBuilder();
        } else {
            deckBuilderScreen.classList.add('hidden');
            gameContainer.classList.remove('hidden');
            newGame();
        }
    };
    
    // Listeners dos Modais
    document.getElementById('modal-close-btn').onclick = hideCardImageModal;
    cardImageModal.onclick = (e) => {
        if (e.target === cardImageModal) hideCardImageModal();
    };

    document.getElementById('play-again-btn').onclick = () => {
        window.location.reload();
    };

    // Listeners para os filtros do Deck Builder
    document.getElementById('filter-rarity').addEventListener('change', (e) => {
      deckBuilderFilters.rarity = e.target.value;
      renderFilteredCardPool();
    });
    document.getElementById('filter-category').addEventListener('change', (e) => {
      deckBuilderFilters.category = e.target.value;
      renderFilteredCardPool();
    });
    document.getElementById('filter-cost').addEventListener('change', (e) => {
      deckBuilderFilters.cost = e.target.value;
      renderFilteredCardPool();
    });
  });