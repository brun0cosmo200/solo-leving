(function () {
  'use strict';

  function el(id) { return document.getElementById(id); }
  function setText(id, v) { const e = el(id); if (e) e.textContent = String(v); }

  function toast(msg) {
    const container = el('toasts');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    container.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 260); }, 1800);
  }

  function render(missionView) {
    const mgr = window.SL_MissionManager;
    const m = missionView || (mgr && mgr.getMissionView());
    const panel = el('mission-real-panel');
    if (!m || !panel) return;

    panel.style.display = '';
    setText('mr-nome', '🔥 ' + m.nome + ' (sistema novo — orientado a evento)');
    setText('mr-desc', m.descricao);
    setText('mr-progresso-label', m.progresso + '/' + m.objetivo.quantidade);

    const fill = el('mr-progresso-fill');
    if (fill) fill.style.width = Math.round((m.progresso / m.objetivo.quantidade) * 100) + '%';

    setText('mr-recompensa', '+' + m.recompensa.xp + ' XP · +' + m.recompensa.coins + ' 🪙');

    const btn = el('mr-claim-btn');
    if (btn) {
      if (m.concluida && !m.recompensaRecebida) {
        btn.style.display = '';
        btn.disabled = false;
        btn.textContent = 'Receber Recompensa';
      } else if (m.recompensaRecebida) {
        btn.style.display = '';
        btn.disabled = true;
        btn.textContent = '✓ Recompensa recebida';
      } else {
        btn.style.display = 'none';
      }
    }
  }

  function handleClaim() {
    const mgr = window.SL_MissionManager;
    if (!mgr) return;
    const result = mgr.claimReward();
    if (result.ok) {
      toast(result.leveled ? '🆙 Recompensa recebida — level up!' : '✅ Recompensa recebida.');
    } else if (result.reason === 'already-claimed') {
      toast('Recompensa já foi recebida.');
    } else if (result.reason === 'not-completed') {
      toast('Missão ainda não concluída.');
    } else {
      toast('Não foi possível receber a recompensa agora.');
    }
    render();
  }

  function patchNavigate() {
    const orig = window.navigate;
    if (typeof orig !== 'function') return false;
    if (orig.__slMissoesPatched) return true;
    const patched = function (page) {
      orig(page);
      if (page === 'missoes') setTimeout(() => render(), 30);
    };
    patched.__slMissoesPatched = true;
    window.navigate = patched;
    return true;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!patchNavigate()) setTimeout(patchNavigate, 400);
    if (window.SL_MissionManager) {
      window.SL_MissionManager.onUIUpdate(render);
    }
  });

  window.SL_MissoesView = { render, handleClaim };
})();   