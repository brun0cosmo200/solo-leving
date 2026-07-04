(function () {
  'use strict';

  // ============================================================
  // GAME FLAGS — infraestrutura de estado permanente.
  //
  // Este módulo não sabe (e não deve saber) o que é "JoinedFactionA" ou
  // "HasKilledVillageChief". Ele só guarda pares nome->valor e avisa quem
  // quiser saber quando algo muda, via SL_EventBus. Quem decide QUAIS
  // flags existem e O QUE elas significam é o sistema que as usa (Facção,
  // NPC, diálogo, missão) — nenhum deles foi implementado ainda porque
  // dependem de conteúdo que ainda não foi definido.
  // ============================================================

  const LS_KEY = 'sl_game_flags_v1';

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function save(flags) {
    localStorage.setItem(LS_KEY, JSON.stringify(flags));
  }

  let flags = load();

  function set(name, value = true) {
    if (!name || typeof name !== 'string') return false;
    const prev = flags[name];
    flags[name] = value;
    save(flags);
    if (prev !== value && window.SL_EventBus) {
      window.SL_EventBus.emit('flag:changed', { name, value, prev });
    }
    return true;
  }

  function unset(name) {
    if (!(name in flags)) return false;
    const prev = flags[name];
    delete flags[name];
    save(flags);
    if (window.SL_EventBus) {
      window.SL_EventBus.emit('flag:changed', { name, value: undefined, prev });
    }
    return true;
  }

  function get(name) {
    return flags[name];
  }

  function has(name) {
    return Object.prototype.hasOwnProperty.call(flags, name) && !!flags[name];
  }

  function list() {
    return { ...flags };
  }

  // ------------------------------------------------------------
  // Avaliador de condição simples — genérico, sem hardcode de nomes.
  // Suporta: { flag: 'X' } | { notFlag: 'Y' } | { all: [...] } | { any: [...] }
  // Isso é o pedaço mínimo que o pilar de "Lore Integrada" (dialogue
  // conditions) precisa pra existir, sem eu inventar quais condições um
  // NPC específico vai ter — isso ainda é conteúdo, não infraestrutura.
  // ------------------------------------------------------------
  function evaluate(condition) {
    if (!condition || typeof condition !== 'object') return true;
    if ('flag' in condition) return has(condition.flag);
    if ('notFlag' in condition) return !has(condition.notFlag);
    if (Array.isArray(condition.all)) return condition.all.every(evaluate);
    if (Array.isArray(condition.any)) return condition.any.some(evaluate);
    return true;
  }

  window.SL_GameFlags = { set, unset, get, has, list, evaluate };
})();