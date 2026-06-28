(function () {
  // Etapa 11 — Ponte (opcional) entre combate (etapa 9) e boss (etapa 10)
  // Não foi solicitado diretamente pelo feedback, mas ajuda a conectar os motores.

  // Exponibiliza um adaptador de eventos.

  const mapActionFromCombatToBoss = {
    'perfect-dodge': 'perfect-dodge',
    'perfect-block': 'perfect-block',
    'charged': 'charged',
    'combo-aerial': 'combo-aerial',
    'dodge': 'dodge',
    'parry': 'block',
  };

  function attach({ combat = window.SL_CombatEtapa9, boss = window.SL_BossEtapa10 } = {}) {
    if (!combat || !boss) return false;

    // Callback hooks para o app chamar quando resolveDefense ocorrer.
    // Motor de combate já retorna {result}. Aqui só provê uma util.

    window.SL_BridgeEtapa11 = {
      observeDefenseResult(defenseResult) {
        const res = defenseResult?.result;
        const mapped = mapActionFromCombatToBoss[res] || null;
        if (mapped) boss.bossObservePlayerAction(mapped);
      },
      observeCombatAction(action) {
        const mapped = mapActionFromCombatToBoss[action] || null;
        if (mapped) boss.bossObservePlayerAction(mapped);
      },
      bossDamageFromPlayerAttack({ attackDamage, element } = {}) {
        // simplifica: reduz hp do boss; elemento é interpretado no boss se você quiser.
        return boss.updateBoss({ damageTaken: attackDamage || 0, element });
      },
    };

    return true;
  }

  attach({});
})();

