// ----- Definição de Cartas (Atualizada) -----
const CARD_POOL = {
    // Básicas
    espadachim: { id:'espadachim', name:'Espadachim', type:'basic', cost:1, desc:'Causa 2 de dano.', art:'⚔️', image: 'espadachim.png', play: ({ctx})=>dealDamage(ctx,2) },
    escudo: { id:'escudo', name:'Escudo de Madeira', type:'basic', cost:1, desc:'Ganha 2 de escudo.', art:'🛡️', image: 'escudodemadeira.png' ,play: ({ctx})=>gainShield(ctx.player,2) },
    flecha: { id:'flecha', name:'Flecha Rápida', type:'basic', cost:0, desc:'Causa 1 de dano.', art:'🏹',image: 'flecharapida.png' , play: ({ctx})=>dealDamage(ctx,1) },
    pocao: { id:'pocao', name:'Poção Menor', type:'basic', cost:1, desc:'Cura 2 PV.', art:'🧪', play: ({ctx})=>heal(ctx.player,2) },
    martelo: { id:'martelo', name:'Martelo de Pedra', type:'basic', cost:2, desc:'Causa 3 de dano.', art:'🔨', play: ({ctx})=>dealDamage(ctx,3) },
    arqueiro: { id:'arqueiro', name:'Arqueiro', type:'basic', cost:2, desc:'2 de dano, ignora 1 de defesa.', art:'🎯', play: ({ctx})=>dealDamage(ctx,2, {ignoreDef:1}) },
    goblin: { id:'goblin', name:'Goblin Saqueador', type:'basic', cost:1, desc:'Causa 3 de dano direto.', art:'👺', image: 'goblinsa.png', play: ({ctx})=>dealDamage(ctx,3) },
  
    // Raras
    mago: { id:'mago', name:'Mago Aprendiz', type:'rare', cost:2, desc:'Causa 4 de dano.', art:'🧙', play: ({ctx})=>dealDamage(ctx,4) },
    barreira: { id:'barreira', name:'Barreira de Pedra', type:'rare', cost:2, desc:'Ganha 5 de escudo.', art:'🧱', play: ({ctx})=>gainShield(ctx.player,5) },
    lamina: { id:'lamina', name:'Lâmina Flamejante', type:'rare', cost:2, desc:'3 de dano, ignora toda a defesa.', art:'🔥', play: ({ctx})=>dealDamage(ctx,3, {ignoreDef:999}) },
    pocaoM: { id:'pocaoM', name:'Poção Maior', type:'rare', cost:2, desc:'Cura 5 PV.', art:'💖', play: ({ctx})=>heal(ctx.player,5) },
    cacador: { id:'cacador', name:'Caçador Sombrio', type:'rare', cost:2, desc:'2 de dano. Se derrotar um alvo, ganha +2 energia.', art:'🦇', play: async ({ctx})=>{
        const defeated = await dealDamage(ctx,2);
        if(defeated){
            log('Caçador Sombrio ativou seu efeito!');
            state[ctx.player].energy = Math.min(5, state[ctx.player].energy + 2);
            updateUI();
        }
    }},
  
    // Lendárias
    dragao: { id:'dragao', name:'Dragão Ancestral', type:'legend', cost:5, desc:'Causa 10 de dano.', art:'🐲', play: ({ctx})=>dealDamage(ctx,10) },
    cavaleiro: { id:'cavaleiro', name:'Cavaleiro Imortal', type:'legend', cost:4, desc:'Causa 6 de dano. (Retorno não impl.)', art:'👻', play: ({ctx})=>dealDamage(ctx,6) },
    tempestade: { id:'tempestade', name:'Tempestade Arcana', type:'legend', cost:4, desc:'Causa 3 de dano ao oponente.', art:'🌪️', play: ({ctx})=>dealDamage(ctx,3) },
    espadaDivina: { id:'espadaDivina', name:'Espada Divina', type:'legend', cost:3, desc:'Dobra o dano da próxima carta de ataque.', art:'✨', play: ({ctx})=>applyEffect(ctx.player, {key:'doubleNextAttack',turns:2}) },
  
    // Jokers
    jokerRed: { id:'jokerRed', name:'Joker Vermelho', type:'joker', cost:2, desc:'Multiplica por 2 todo o dano neste turno.', art:'🔴', play: ({ctx})=>applyEffect(ctx.player, {key:'doubleAllDamage',turns:1}) },
    jokerBlue: { id:'jokerBlue', name:'Joker Azul', type:'joker', cost:1, desc:'Defesas também curam 2 PV neste turno.', art:'🔵', play: ({ctx})=>applyEffect(ctx.player, {key:'defHeal',turns:1}) },
    jokerGreen: { id:'jokerGreen', name:'Joker Verde', type:'joker', cost:3, desc:'Permite comprar 2 cartas.', art:'🟢', play: ({ctx})=>{ drawCard(ctx.player); drawCard(ctx.player); } },
    jokerGold: { id:'jokerGold', name:'Joker Dourado', type:'joker', cost:4, desc:'Revive 1 carta do descarte para a mão.', art:'🟡', play: ({ctx})=>reviveFromDiscard(ctx) }
  };
  
  // Array de cartas do pool com raridade
  const CARD_POOL_PLAYER = [
      ...Array(10).fill(CARD_POOL.espadachim),
      ...Array(8).fill(CARD_POOL.escudo),
      ...Array(10).fill(CARD_POOL.flecha),
      ...Array(8).fill(CARD_POOL.pocao),
      ...Array(5).fill(CARD_POOL.martelo),
      ...Array(5).fill(CARD_POOL.arqueiro),
      ...Array(5).fill(CARD_POOL.goblin),
      
      ...Array(4).fill(CARD_POOL.mago),
      ...Array(4).fill(CARD_POOL.barreira),
      ...Array(3).fill(CARD_POOL.lamina),
      ...Array(3).fill(CARD_POOL.pocaoM),
      ...Array(2).fill(CARD_POOL.cacador),
      
      ...Array(1).fill(CARD_POOL.dragao),
      ...Array(1).fill(CARD_POOL.cavaleiro),
      ...Array(1).fill(CARD_POOL.tempestade),
      ...Array(1).fill(CARD_POOL.espadaDivina),
      
      ...Array(1).fill(CARD_POOL.jokerRed),
      ...Array(1).fill(CARD_POOL.jokerBlue),
      ...Array(1).fill(CARD_POOL.jokerGreen),
      ...Array(1).fill(CARD_POOL.jokerGold),
  ];
  
  // IDs de cartas Lendárias e Jokers
  const RARE_CARD_TYPES = ['legend', 'joker'];
  
  // ----- Estado do Jogo -----
  let state = null;
  
  function newGame() {
    state = {
      turn: 1,
      active: 'player',
      player: { id: 'player', name: 'Jogador', pv: 20, deck: shuffle(buildStarterDeck()), hand: [], discard: [], energy: 0, shield: 0 },
      enemy: { id: 'enemy', name: 'Inimigo', pv: 20, deck: shuffle(buildStarterDeck()), hand: [], discard: [], energy: 0, shield: 0 },
      activeEffects: [],
      log: [],
      gameEnded: false,
      playedCards: [], // Cartas jogadas neste turno
      undoStack: [] // Histórico de ações do jogador (para desfazer)
    };
    for(let i=0; i<5; i++) { drawCard('player'); drawCard('enemy'); }
    startTurn('player');
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
      if (p.deck.length === 0) {
          if(p.discard.length > 0) {
              log(`${p.name} ficou sem cartas! Reembaralhando o descarte.`);
              p.deck = shuffle(p.discard);
              p.discard = [];
          } else {
              log(`${p.name} não tem cartas! Perde 2 PV.`);
              p.pv -= 2;
              showDamageIndicator(2, document.getElementById(`${who}-avatar`));
              checkWin();
              updateUI();
              return null;
          }
      }
      
      let card;
      if (who === 'player' && p.energy === 5) {
          // Lógica de aumento de drop rate (energia cheia)
          const baseDeck = p.deck.map(c => c.id);
          const fullDeck = [...baseDeck, ...CARD_POOL_PLAYER.filter(c => RARE_CARD_TYPES.includes(c.type)).map(c => c.id)];
          
          // Pesquisa por uma carta no deck aumentado. Se for rara, tem uma chance maior.
          const randomId = fullDeck[Math.floor(Math.random() * fullDeck.length)];
          const idx = p.deck.findIndex(c => c.id === randomId);

          if (idx !== -1) {
              card = p.deck.splice(idx, 1)[0];
              if (RARE_CARD_TYPES.includes(card.type)) {
                  log('Chance de carta Lendária/Joker aumentada! Uma carta rara foi comprada.');
              }
          } else {
              // Se não achou no deck, deve ser por que o deck principal não tinha mais
              // (Isso não deve acontecer se a baseDeck for usada corretamente, mas é um fallback)
              card = p.deck.shift();
          }
      } else {
          card = p.deck.shift();
      }
      
      p.hand.push(card);
      updateUI();
      return card;
  }
  
  function log(msg) {
    state.log.unshift(`[T${state.turn}] ${msg}`);
    if(state.log.length > 50) state.log.pop();
    updateUI();
  }
  
  function startTurn(who) {
      if (state.gameEnded) return;
      state.active = who;
      const p = state[who];
  
      // Reseta estado do turno do jogador
      if (who === 'player') {
          state.playedCards = []; // Limpa mesa
          state.undoStack = []; // Limpa histórico de jogadas
          document.getElementById('end-turn').disabled = false;
          document.getElementById('undo-move').disabled = true;
      }
  
      // Efeitos de início de turno
      p.shield = 0; // Escudo reseta a cada turno
      p.energy = Math.min(5, p.energy + 2);
      
      if (who === 'player') {
          log('Seu turno começou. Você ganhou +2 de Energia.');
      } else {
          log('Turno do Inimigo.');
      }
  
      drawCard(who);
      
      // Processar efeitos que duram turnos
      state.activeEffects = state.activeEffects.filter(eff => {
          if (eff.owner === who) {
              eff.turns--;
              if (eff.turns <= 0) {
                  log(`Efeito '${eff.key}' expirou para ${p.name}.`);
                  return false;
              }
          }
          return true;
      });
      
      updateUI();
  
      if (who === 'enemy') {
          setTimeout(enemyAI, 1000);
      }
  }
  
  function endTurn() {
      if (state.active === 'player') {
          document.getElementById('end-turn').disabled = true;
          log('Você terminou seu turno.');
          // Cartas jogadas vão para o descarte no final do turno
          state.player.discard.push(...state.playedCards);
          state.playedCards = [];
          state.turn++;
          startTurn('enemy');
      } else {
          log('Inimigo terminou o turno.');
          state.enemy.discard.push(...state.playedCards); // Inimigo também descarta
          state.playedCards = []; // Limpa mesa do inimigo (compartilhada)
          startTurn('player');
      }
  }

  // NOVA FUNÇÃO: Desfazer a última jogada
  function undoMove() {
      if (state.gameEnded || state.active !== 'player' || state.undoStack.length === 0) return;

      const lastMove = state.undoStack.pop();
      const p = state.player;
      const opponent = state.enemy; // O oponente é sempre o inimigo quando o player desfaz
      
      // Reverter estado para antes da jogada (Player)
      p.energy = lastMove.prevEnergy;
      p.pv = lastMove.prevPV;
      p.shield = lastMove.prevShield;
      p.deck = lastMove.prevDeck;
      p.discard = lastMove.prevDiscard;

      // FIX: Reverter estado do Oponente
      opponent.pv = lastMove.prevOpponentPV;
      opponent.shield = lastMove.prevOpponentShield;
      
      // Colocar carta de volta na mão (da mesa/playedCards)
      const cardToReturn = state.playedCards.pop();
      if (cardToReturn) {
          p.hand.push(cardToReturn);
          log(`Retornada a jogada de ${cardToReturn.name}.`);
      }
      
      // Desabilita o undo após uma reversão
      document.getElementById('undo-move').disabled = true; 
      updateUI();
  }
  
  async function playCard(who, handIdx) {
      if (state.gameEnded || who !== state.active || who !== 'player') return;
      const p = state[who];
      const card = p.hand[handIdx];
      if (!card || card.cost > p.energy) return;
  
      // Salvando o estado antes da jogada (para o undo)
      state.undoStack.push({
          prevEnergy: p.energy,
          prevPV: p.pv,
          prevShield: p.shield,
          prevDeck: p.deck.slice(),
          prevDiscard: p.discard.slice(),

          // FIX: Salvando estado do Oponente (sempre o 'enemy' quando o 'player' joga)
          prevOpponentPV: state.enemy.pv,
          prevOpponentShield: state.enemy.shield,

          cardId: card.id
      });

      p.energy -= card.cost;
      const playedCard = p.hand.splice(handIdx, 1)[0];
      
      log(`Você jogou ${card.name}.`);
      
      // O contexto define quem é o jogador e quem é o oponente
      const context = { ctx: { player: who, opponent: 'enemy' } };
      await card.play(context);
      
      // Adiciona a carta jogada à mesa
      state.playedCards.push(playedCard);
  
      document.getElementById('undo-move').disabled = false;
      updateUI();
  }
  
  function enemyAI() {
      if (state.gameEnded) return;
      const enemy = state.enemy;
      const playableCards = enemy.hand.map((c, i) => ({card: c, index: i})).filter(item => item.card.cost <= enemy.energy);
  
      if (playableCards.length > 0) {
          // AI simples: joga a primeira carta que pode
          const { card, index } = playableCards[0];
          
          enemy.energy -= card.cost;
          const playedCard = enemy.hand.splice(index, 1)[0];
  
          log(`Inimigo jogou ${card.name}.`);
  
          const context = { ctx: { player: 'enemy', opponent: 'player' } };
          card.play(context);
          
          // Inimigo adiciona carta à mesa (compartilhada)
          state.playedCards.push(playedCard);
          
          updateUI();
          setTimeout(() => enemyAI(), 1200); // Tenta jogar outra carta
      } else {
          setTimeout(endTurn, 700);
      }
  }
  
  // ----- Efeitos das Cartas -----
  async function dealDamage(ctx, amount, opts = {}) {
    const defender = state[ctx.opponent];
    let dmg = amount;
  
    if(hasEffect(ctx.player,'doubleAllDamage')) dmg *= 2;
    if(hasEffect(ctx.player,'doubleNextAttack')){ dmg *= 2; removeEffect(ctx.player,'doubleNextAttack'); }
    
    let ignoredShield = 0;
    if (opts.ignoreDef) {
        ignoredShield = Math.min(defender.shield, opts.ignoreDef);
    }
    
    const shieldBlock = Math.max(0, defender.shield - ignoredShield);
    const finalDamage = Math.max(0, dmg - shieldBlock);
    
    // Atualiza o escudo do defensor
    defender.shield = Math.max(0, defender.shield - dmg);
    
    // Aplica o dano real
    defender.pv -= finalDamage;
    
    log(`${state[ctx.player].name} causou ${dmg} de dano a ${defender.name}. ${shieldBlock} bloqueado.`);
    showDamageIndicator(finalDamage, document.getElementById(`${ctx.opponent}-avatar`));
    
    updateUI();
    await new Promise(resolve => setTimeout(resolve, 500)); // Pequeno delay para a animação
    const defeated = checkWin();
    return defender.pv <= 0; // Retorna se o alvo foi derrotado
  }
  
  function gainShield(who, amount) {
      const p = state[who];
      if (hasEffect(who, 'defHeal')) {
          heal(who, 2);
      }
      p.shield += amount;
      log(`${p.name} ganhou ${amount} de escudo.`);
      updateUI();
  }
  
  function heal(who, amount) {
      const p = state[who];
      p.pv += amount;
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
      if(p.discard.length === 0) {
          log('Descarte vazio.'); return;
      }
      const revivedCard = p.discard.pop();
      p.hand.push(revivedCard);
      log(`${p.name} reviveu ${revivedCard.name} do descarte.`);
      updateUI();
  }
  
  function checkWin() {
      if (state.gameEnded) return true;
      if (state.player.pv <= 0 || state.enemy.pv <= 0) {
          state.gameEnded = true;
          const winner = state.player.pv > 0 ? state.player.name : state.enemy.name;
          setTimeout(() => {
              alert(`Fim de Jogo! Vencedor: ${winner}`);
              newGame();
          }, 1000);
          return true;
      }
      return false;
  }
  
  // ----- Renderização e UI -----

  // NOVA FUNÇÃO: Renderiza uma única carta (usada para mão e mesa)
  function renderCard(card, isSmall = false) {
    const el = document.createElement('div');
    el.className = 'card';
    if(isSmall) el.classList.add('small-card'); // Pode ser útil para estilos futuros na mesa
    el.dataset.type = card.type;

    // ** LÓGICA DE RENDERIZAÇÃO ATUALIZADA **
    if (card.image) {
      // Se a carta tem uma imagem, usa como fundo
      el.classList.add('full-image');
      el.style.backgroundImage = `url('${card.image}')`;
    } else {
      // Senão, usa o estilo antigo com texto
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

    // Stats do Jogador
    document.getElementById('player-pv').textContent = `${state.player.pv} PV ${state.player.shield > 0 ? `(+${state.player.shield}🛡️)`: ''}`;
    document.getElementById('player-deck').textContent = state.player.deck.length;
    document.getElementById('player-discard').textContent = state.player.discard.length;
    
    // Stats do Inimigo
    document.getElementById('enemy-pv').textContent = `${state.enemy.pv} PV ${state.enemy.shield > 0 ? `(+${state.enemy.shield}🛡️)`: ''}`;
    document.getElementById('enemy-deck').textContent = state.enemy.deck.length;
    document.getElementById('enemy-discard').textContent = state.enemy.discard.length;
    document.getElementById('enemy-energy').textContent = state.enemy.energy;
    
    // Turno
    document.getElementById('turn-indicator').textContent = `Turno ${state.turn}`;
    
    // Botão Desfazer
    const undoBtn = document.getElementById('undo-move');
    if (state.active === 'player') {
        undoBtn.disabled = state.undoStack.length === 0;
    } else {
        undoBtn.disabled = true;
    }

    // Energia do Jogador
    const energyBar = document.getElementById('player-energy');
    energyBar.innerHTML = '';
    for(let i=0; i<5; i++){
      const orb = document.createElement('div');
      orb.className = `energy-orb ${i < state.player.energy ? 'filled' : ''}`;
      energyBar.appendChild(orb);
    }
  
    // Mão do Jogador
    const hand = document.getElementById('hand');
    hand.innerHTML = '';
    state.player.hand.forEach((card, idx) => {
      const el = renderCard(card, false);
      if (card.cost <= state.player.energy) {
        el.classList.add('playable');
      }
      el.onclick = () => playCard('player', idx);
      hand.appendChild(el);
    });
    
    // Cartas Jogadas (Mesa)
    const playedCardsArea = document.getElementById('played-cards');
    playedCardsArea.innerHTML = '';
    state.playedCards.forEach(card => {
        const el = renderCard(card, true);
        playedCardsArea.appendChild(el);
    });

    // Log
    document.getElementById('log-area').innerHTML = state.log.map(entry => `<div class="log-entry">${entry}</div>`).join('');
  }
  
  function showDamageIndicator(amount, targetElement) {
      if (amount <= 0) return;
      const indicator = document.createElement('div');
      indicator.className = 'damage-indicator';
      indicator.textContent = `-${amount}`;
      document.body.appendChild(indicator);
  
      const rect = targetElement.getBoundingClientRect();
      indicator.style.left = `${rect.left + rect.width / 2 - indicator.offsetWidth / 2}px`;
      indicator.style.top = `${rect.top - indicator.offsetHeight}px`;
  
      setTimeout(() => indicator.remove(), 1500);
  }
  
  
  // ----- Início do Jogo -----
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('end-turn').onclick = endTurn;
    document.getElementById('undo-move').onclick = undoMove; // Listener para o novo botão
    newGame();
  });