// ================= CONFIG =================
const SUPA_URL = 'https://siczyohqmlrmirqgzlxb.supabase.co';
const SUPA_KEY = 'SUA_PUBLIC_KEY_AQUI';
const CONDO_ID = 'SEU_CONDOMINIO_ID_AQUI';

// ================= VARIÁVEIS =================
let _moradores = [];
let _filtro = 'todos';

// ================= AUTH =================
function headers() {
  return {
    apikey: SUPA_KEY,
    Authorization: `Bearer ${SUPA_KEY}`,
    'Content-Type': 'application/json'
  };
}

// ================= LOAD =================
async function loadMoradores() {
  try {
    const res = await fetch(
      `${SUPA_URL}/rest/v1/usuarios?condominio_id=eq.${CONDO_ID}&select=*`,
      { headers: headers() }
    );
    _moradores = res.ok ? await res.json() : [];
    renderFiltroApto();
    renderCards();
  } catch (e) {
    console.error(e);
  }
}

// ================= UI =================
function renderFiltroApto() {
  const sel = document.getElementById('filtroApto');
  const aptos = [...new Set(_moradores.map(m => m.unidade).filter(Boolean))];

  sel.innerHTML =
    '<option value="">Todos os aptos</option>' +
    aptos.map(a => `<option value="${a}">Apto ${a}</option>`).join('');
}

function renderCards() {
  const busca = document.getElementById('busca').value.toLowerCase();
  const filtroApto = document.getElementById('filtroApto').value;
  const grid = document.getElementById('moradoresGrid');

  const lista = _moradores.filter(m => {
    if (busca && !(`${m.nome || ''} ${m.unidade || ''}`.toLowerCase().includes(busca)))
      return false;
    if (filtroApto && m.unidade !== filtroApto) return false;
    return true;
  });

  if (lista.length === 0) {
    grid.innerHTML = '<div class="empty-state">Nenhum morador encontrado.</div>';
    return;
  }

  grid.innerHTML = lista.map(m => {
    const contato = m.telefone
      ? m.telefone
      : (m.email ? m.email : 'Sem contato');

    return `
      <div class="morador-card">
        <strong>${m.nome}</strong><br/>
        <small>Apto ${m.unidade || '-'}</small><br/>
        <small>${contato}</small><br/><br/>
        <button onclick="abrirModal(${m.id})">✏ Editar</button>
        <button onclick="deletar(${m.id}, '${(m.nome || '').replace(/'/g,"\\'")}')">🗑 Excluir</button>
      </div>
    `;
  }).join('');
}

// ================= AÇÕES =================
function abrirModal(id) {
  alert('Abrir modal do morador ID: ' + id);
}

async function deletar(id, nome) {
  if (!confirm(`Excluir o morador "${nome}"?`)) return;

  const res = await fetch(
    `${SUPA_URL}/rest/v1/usuarios?id=eq.${id}`,
    { method: 'DELETE', headers: headers() }
  );

  if (res.ok) {
    _moradores = _moradores.filter(m => m.id !== id);
    renderCards();
    alert('Morador excluído');
  } else {
    alert('Erro ao excluir');
  }
}

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('busca').addEventListener('input', renderCards);
  document.getElementById('filtroApto').addEventListener('change', renderCards);
  loadMoradores();
});
``
