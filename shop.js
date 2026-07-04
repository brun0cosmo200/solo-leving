(function () {
  'use strict';

  const LS_AUTH = 'sl_auth_state_v1';
  const LS_SHOP = 'sl_shop_purchases_v1';

  const CATALOG = [
    {
      key: 'coroa-monarca',
      nome: 'Coroa do Monarca',
      icon: '👑',
      rarity: 'Lendário',
      type: 'Armadura',
      category: 'Armadura',
      price: 28000,
      description: 'Capacete lendário · +180 INT · +120 VIT',
      destaque: true,
      desconto: 30,
      minLevel: 60,
      weightKg: 1.8,
      durability: 100,
      origin: 'Torre do Sistema',
      history: 'Forjada no ápice do Sistema por um monarca que preferiu o anonimato.',
      visualEffect: 'Glow dourado e trilha luminosa ao passar o cursor.',
    },
    {
      key: 'daga-espectral',
      nome: 'Daga Espectral',
      icon: '🗡️',
      rarity: 'Épico',
      type: 'Arma',
      category: 'Arma',
      price: 12500,
      description: 'Arma épica · +95 ATK · Elemento: Sombra',
      minLevel: 30,
      weightKg: 0.6,
      durability: 88,
      origin: 'Vazio Ancestral',
      history: 'Apareceu selada numa fenda que já não existe.',
      visualEffect: 'Aura intensa com pulsos em 2 ritmos diferentes.',
    },
    {
      key: 'elixir-mana',
      nome: 'Elixir de Mana',
      icon: '🧪',
      rarity: 'Raro',
      type: 'Consumível',
      category: 'Consumível',
      price: 800,
      description: 'Restaura 120 de Mana instantaneamente',
      minLevel: 1,
      weightKg: 0.1,
      durability: 100,
      origin: 'Mercado de Seul',
      history: 'Fabricado por uma alquimista anônima que não cobra pelo segredo.',
      visualEffect: 'Partículas violetas orbitam lentamente ao redor do item.',
    },
    {
      key: 'pergaminho-b',
      nome: 'Pergaminho B',
      icon: '📜',
      rarity: 'Comum',
      type: 'Pergaminho',
      category: 'Pergaminho',
      price: 250,
      description: 'Receita de habilidade de rank B',
      minLevel: 20,
      weightKg: 0.05,
      durability: 100,
      origin: 'Guilda de Seul',
      history: 'Circula entre caçadores de rank B há gerações.',
      visualEffect: 'Brilho discreto e ruído de fundo nas bordas.',
    },
    {
      key: 'cristal-despertar',
      nome: 'Cristal de Despertar',
      icon: '💎',
      rarity: 'Lendário',
      type: 'Material',
      category: 'Material',
      price: 50000,
      description: 'Material lendário para awakening de rank S',
      minLevel: 80,
      weightKg: 0.3,
      durability: 100,
      origin: 'Dungeon do Monarca',
      history: 'Diz-se que foi tocado por um monarca invisível.',
      visualEffect: 'Glow dourado e trilha luminosa ao passar o cursor.',
    },
    {
      key: 'escudo-ferro-sombrio',
      nome: 'Escudo de Ferro Sombrio',
      icon: '🛡️',
      rarity: 'Raro',
      type: 'Armadura',
      category: 'Armadura',
      price: 7200,
      description: 'Escudo raro · +140 DEF · Resistência sombra',
      minLevel: 25,
      weightKg: 4.2,
      durability: 95,
      origin: 'Dungeon de Ferro',
      history: 'Forjado nas profundezas da dungeon que leva seu nome.',
      visualEffect: 'Partículas violetas orbitam lentamente ao redor do item.',
    },
    {
      key: 'pocao-cura-x5',
      nome: 'Poção de Cura x5',
      icon: '🧴',
      rarity: 'Comum',
      type: 'Consumível',
      category: 'Consumível',
      price: 400,
      description: 'Restaura 80 HP cada · Pacote com 5 unidades',
      minLevel: 1,
      weightKg: 0.5,
      durability: 100,
      origin: 'Mercado de Seul',
      history: 'Começou como sucata e terminou como ferramenta fiel.',
      visualEffect: 'Brilho discreto e ruído de fundo nas bordas.',
    },
    {
      key: 'runa-velocidade',
      nome: 'Runa de Velocidade',
      icon: '⚡',
      rarity: 'Épico',
      type: 'Acessório',
      category: 'Acessório',
      price: 9000,
      description: 'Acessório épico · +35% velocidade de ataque',
      minLevel: 35,
      weightKg: 0.2,
      durability: 80,
      origin: 'Torre do Sistema',
      history: 'Mantém a promessa de transformar dor em avanço.',
      visualEffect: 'Aura intensa com pulsos em 2 ritmos diferentes.',
    },
    {
      key: 'orbe-identificacao',
      nome: 'Orbe de Identificação',
      icon: '🔮',
      rarity: 'Comum',
      type: 'Orbe',
      category: 'Orbe',
      price: 300,
      description: 'Revela atributos ocultos de itens não identificados',
      minLevel: 1,
      weightKg: 0.15,
      durability: 100,
      origin: 'Porto de Vidro',
      history: 'Cruza fronteiras onde rank e moral deixam de fazer sentido.',
      visualEffect: 'Brilho discreto e ruído de fundo nas bordas.',
    },
  ];

  function readAuth() {
    try { return JSON.parse(localStorage.getItem(LS_AUTH)); } catch { return null; }
  }

  function writeAuth(auth) {
    try { localStorage.setItem(LS_AUTH, JSON.stringify(auth)); } catch (e) { console.warn('[Shop]', e); }
  }

  function getCoins() {
    const auth = readAuth();
    return (auth && auth.character && auth.character.coins) || 0;
  }

  function deductCoins(amount) {
    const auth = readAuth();
    if (!auth || !auth.character) return false;
    if (auth.character.coins < amount) return false;
    auth.character.coins -= amount;
    writeAuth(auth);
    if (window.AuthPlayer) window.AuthPlayer.renderPlayerHUD();
    return true;
  }

  function getPlayerLevel() {
    const auth = readAuth();
    return (auth && auth.character && auth.character.level) || 1;
  }

  function loadPurchases() {
    try { return JSON.parse(localStorage.getItem(LS_SHOP)) || []; } catch { return []; }
  }

  function savePurchase(key) {
    const p = loadPurchases();
    p.push({ key, at: Date.now() });
    localStorage.setItem(LS_SHOP, JSON.stringify(p));
  }

  function toast(msg) {
    const c = document.getElementById('toasts');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 260); }, 2200);
  }

  function buy(key) {
    const item = CATALOG.find(c => c.key === key);
    if (!item) { toast('Item não encontrado.'); return; }

    const precoReal = item.desconto ? Math.round(item.price * (1 - item.desconto / 100)) : item.price;

    if (getPlayerLevel() < (item.minLevel || 1)) {
      toast('Nível insuficiente para este item.');
      return;
    }

    if (getCoins() < precoReal) {
      toast('Moedas insuficientes. Faltam ' + (precoReal - getCoins()).toLocaleString('pt-BR') + ' 🪙.');
      return;
    }

    if (!deductCoins(precoReal)) { toast('Erro ao processar compra.'); return; }

    const inv = window.SL_InventoryEtapa5;
    if (inv && inv.addItem) {
      inv.addItem({
        name: item.nome, rarity: item.rarity, type: item.type, category: item.category,
        description: item.description, history: item.history, origin: item.origin,
        visualEffect: item.visualEffect, price: item.price, weightKg: item.weightKg,
        durability: item.durability, minLevel: item.minLevel, seed: 'shop_' + key,
      });
    }

    savePurchase(key);
    updateCoinsDisplay();
    toast('✅ ' + item.nome + ' comprado por ' + precoReal.toLocaleString('pt-BR') + ' 🪙!');

    const fx = window.SL_EffectsEtapa11;
    if (fx) fx.brilho({ x: 50, y: 50, duration: 320 });
  }

  function updateCoinsDisplay() {
    const coins = getCoins();
    const el = document.querySelector('#view-loja .page-header__actions .font-display');
    if (el) el.textContent = coins.toLocaleString('pt-BR') + ' 🪙';
  }

  const RARITY_CLASS = { 'Comum': '', 'Incomum': 'item-card--incomum', 'Raro': 'item-card--raro', 'Épico': 'item-card--epico', 'Lendário': 'item-card--lend', 'Mítico': 'item-card--mitico', 'Divino': 'item-card--divino' };
  const RARITY_TAG   = { 'Comum': 'tag--dim', 'Incomum': 'tag--azure', 'Raro': 'tag--violet', 'Épico': 'tag--violet', 'Lendário': 'tag--gold', 'Mítico': 'tag--crimson', 'Divino': 'tag--gold' };

  function renderShop() {
    updateCoinsDisplay();

    // Botão do destaque
    const destaqueBtn = document.querySelector('#view-loja .panel--gold .btn');
    const destaqueItem = CATALOG.find(c => c.destaque);
    if (destaqueBtn && destaqueItem) {
      destaqueBtn.onclick = () => buy(destaqueItem.key);
      const precoReal = Math.round(destaqueItem.price * (1 - (destaqueItem.desconto || 0) / 100));
      const priceEl = document.querySelector('#view-loja .panel--gold .font-display');
      if (priceEl) priceEl.textContent = precoReal.toLocaleString('pt-BR');
    }

    const grid = document.querySelector('#view-loja .g4');
    if (!grid) return;

    const playerLevel = getPlayerLevel();
    const nonDestaque = CATALOG.filter(c => !c.destaque);
    grid.innerHTML = '';

    nonDestaque.forEach(item => {
      const bloqueado = playerLevel < (item.minLevel || 1);
      const card = document.createElement('div');
      card.className = 'item-card ' + (RARITY_CLASS[item.rarity] || '');
      if (bloqueado) card.style.opacity = '0.45';

      card.innerHTML =
        '<div class="item-card__icon">' + item.icon + '</div>' +
        '<div class="item-card__name">' + item.nome + '</div>' +
        '<div class="item-card__tag"><span class="tag ' + (RARITY_TAG[item.rarity] || 'tag--dim') + '" style="font-size:.7rem">' + item.rarity + '</span></div>' +
        '<div class="item-card__tag" style="margin-top:var(--sp-1)">' + item.price.toLocaleString('pt-BR') + ' 🪙</div>' +
        '<button class="btn btn--primary btn--sm" style="margin-top:var(--sp-2);width:100%"' +
          (bloqueado ? ' disabled title="Nível insuficiente"' : '') + '>' +
          (bloqueado ? '🔒 Nv.' + item.minLevel : 'Comprar') +
        '</button>';

      const btn = card.querySelector('button');
      if (btn && !bloqueado) btn.addEventListener('click', (e) => { e.stopPropagation(); buy(item.key); });

      grid.appendChild(card);
    });

    const footer = document.querySelector('#view-loja .page-footer span:last-child');
    if (footer) footer.textContent = 'Mostrando ' + nonDestaque.length + ' de ' + CATALOG.length + ' itens';
  }

  function init() {
    const view = document.getElementById('view-loja');
    if (!view) return;
    renderShop();
    const obs = new MutationObserver(() => { if (view.classList.contains('active')) renderShop(); });
    obs.observe(view, { attributes: true, attributeFilter: ['class'] });
  }

  document.addEventListener('DOMContentLoaded', init);
  window.SL_Shop = { buy, getCoins, CATALOG };
})();