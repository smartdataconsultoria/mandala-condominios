// ── CONFIG ───────────────────────────────────────────────
const SUPA_URL = 'https://siczyohqmlrmirqgzlxb.supabase.co';
const SUPA_KEY = 'SUA_ANON_KEY_AQUI';
const CONDO_ID = 'eefc41c0-519b-419b-847f-eb4724455baa';
const CONDO_NOME = 'Edifício Mandala';

let _moradores = [];
let _filtro = 'todos';
let _editId = null;

// ── AUTH ────────────────────────────────────────────────
function getToken() {
  const k = Object.keys(localStorage).find(k => k.includes('auth-token'));
  if (!k) return null;
  try {
    const sess = JSON.parse(localStorage.getItem(k));
    return sess?.access_token || null;
  } catch {
    return null;
  }
}

function hdrs() {
  const tk = getToken();
  return {
    'Content-Type': 'application/json',
    apikey: SUPA_KEY,
    Authorization: `Bearer ${tk || SUPA_KEY}`
  };
}

// ── LOAD ────────────────────────────────────────────────
async function loadMoradores() {
  const res = await fetch(
    `${SUPA_URL}/rest/v1/usuarios?condominio_id=eq.${CONDO_ID}&order=unidade,nome`,
    { headers: hdrs() }
  );
  _moradores = res.ok ? await res.json() : [];
  renderStats();
  renderFiltroApto();
  renderCards();
}

// ── STATS ───────────────────────────────────────────────
function renderStats() {
  const ativos = _moradores.filter(m => m.ativo);
  const aptos = [...new Set(ativos.map(m => m.unidade))];

  document.getElementById('statAptos').textContent = aptos.length;
  document.getElementById('statAtivos').textContent = ativos.length;
  document.getElementById('statProprietarios').textContent =
    ativos.filter(m => m.role === 'sindico' || m.role === 'administradora').length;
  document.getElementById('statInquilinos').textContent =
    ativos.filter(m => m.role === 'morador').length;
}

function renderFiltroApto() {
  const sel = document.getElementById('filtroApto');
  const aptos = [...new Set(_moradores.map(m => m.unidade).filter(Boolean))];

  sel.innerHTML =
    '<option value="">Todos os aptos</option>' +
    aptos.map(a => `<option value="${a}">Apto ${a}</option>`).join('');
}

// ── CARDS ───────────────────────────────────────────────
function renderCards() {
  const busca = document.getElementById('busca')?.value.toLowerCase() || '';
  const filtApto = document.getElementById('filtroApto')?.value || '';
  const grid = document.getElementById('moradoresGrid');

  const lista = _moradores.filter(m => {
    if (filtApto && m.unidade !== filtApto) return false;
    if (busca) {
      const base = `${m.nome || ''} ${m.unidade || ''} ${m.email || ''}`.toLowerCase();
      if (!base.includes(busca)) return false;
    }
    return true;
  });

  if (lista.length === 0) {
    grid.innerHTML = '<div class="empty-state">Nenhum morador encontrado.</div>';
    return;
  }

  grid.innerHTML = lista.map(m => {
    const contato = m.telefone || m.email || 'Sem contato';
    const apto = m.unidade ? `Apto ${m.unidade}` : 'Sem apto';

    return `
      <div class="morador-card">
        <div class="card-top">
          <div class="avatar">${iniciais(m.nome)}</div>
          <div class="card-info">
            <div class="card-nome">${m.nome}</div>
            <div class="card-apto">${apto}</div>
            <div class="card-tipo">${m.role}</div>
          </div>
        </div>

        <div class="card-bottom">
          <div class="card-contato">${contato}</div>
          <div class="card-actions">
            <button class="btn-icon btn-edit" data-id="${m.id}">✏</button>
            <button class="btn-icon del" data-id="${m.id}" data-nome="${m.nome}">🗑</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // eventos
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      abrirModal(btn.dataset.id);
    });
  });

  document.querySelectorAll('.del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deletar(btn.dataset.id, btn.dataset.nome);
    });
  });
}

// ── MODAL ───────────────────────────────────────────────
function abrirModal(id) {
  _editId = id || null;
  console.log('Editar morador ID:', id);
  document.getElementById('modalBg').classList.add('open');
}

// ── DELETAR ─────────────────────────────────────────────
async function deletar(id, nome) {
  if (!confirm(`Excluir o morador "${nome}"?`)) return;

  const res = await fetch(
    `${SUPA_URL}/rest/v1/usuarios?id=eq.${id}&condominio_id=eq.${CONDO_ID}`,
    { method: 'DELETE', headers: hdrs() }
  );

  if (res.ok) {
    _moradores = _moradores.filter(m => m.id !== id);
    renderCards();
  } else {
    alert('Erro ao remover morador');
  }
}

// ── INIT ────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('condoNome').innerHTML = CONDO_NOME;
  loadMoradores();
});
