// ── CONFIG ───────────────────────────────────────────────
const SUPA_URL = 'https://siczyohqmlrmirqgzlxb.supabase.co';
const SUPA_KEY = 'SUA_ANON_KEY_AQUI';
const SERVICE_KEY = 'SUA_SERVICE_KEY_AQUI';
const CONDO_ID = 'eefc41c0-519b-419b-847f-eb4724455baa';
const CONDO_NOME = 'Edifício Mandala';

let _moradores = [];
let _filtro = 'todos';
let _editId = null;
let _fotoFile = null;

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

// ── RENDER CARDS ────────────────────────────────────────
function renderCards() {
  const busca = document.getElementById('busca').value.toLowerCase();
  const filtApto = document.getElementById('filtroApto').value;

  const lista = _moradores.filter(m => {
    if (_filtro === 'ativo' && !m.ativo) return false;
    if (_filtro === 'inativo' && m.ativo) return false;
    if (filtApto && m.unidade !== filtApto) return false;

    if (busca) {
      const txt = `${m.nome || ''} ${m.unidade || ''} ${m.email || ''}`.toLowerCase();
      if (!txt.includes(busca)) return false;
    }
    return true;
  });

  const grid = document.getElementById('moradoresGrid');

  if (lista.length === 0) {
    grid.innerHTML = `<div class="empty-state">Nenhum morador encontrado.</div>`;
    return;
  }

  grid.innerHTML = lista.map(m => {
    const contato = m.telefone || m.email || 'Sem contato';

    return `
      <div class="morador-card">
        <div class="card-top">
          <div class="avatar">${iniciais(m.nome)}</div>
          <div class="card-info">
            <div class="card-nome">${m.nome}</div>
            <div class="card-apto">Apto ${m.unidade || '-'}</div>
          </div>
        </div>

        <div class="card-bottom">
          <div class="card-contato">${contato}</div>
          <div class="card-actions">
            <button class="btn-icon btn-edit" data-id="${m.id}">✏</button>
            <button class="btn-icon del" onclick="deletar(${m.id}, '${m.nome.replace(/'/g, "\\'")}')">🗑</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // ✅ Evento de editar (sem JS inválido)
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      abrirModal(btn.dataset.id);
    });
  });
}

// ── MODAL ───────────────────────────────────────────────
function abrirModal(id) {
  _editId = id || null;
  console.log('Editar morador ID:', id);
  document.getElementById('modalBg').classList.add('open');
}

// ── INIT ────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('condoNome').innerHTML = CONDO_NOME;
  loadMoradores();
});
