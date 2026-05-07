// ================= CONFIG =================
const SUPA_URL = 'https://siczyohqmlrmirqgzlxb.supabase.co';
const SUPA_KEY = 'SUA_ANON_KEY_AQUI';
const CONDO_ID = 'SEU_CONDOMINIO_ID_AQUI';

// ================= AUTH =================
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

function headers() {
  const token = getToken();
  return {
    apikey: SUPA_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// ================= STATE =================
let moradores = [];

// ================= LOAD =================
async function loadMoradores() {
  const res = await fetch(
    `${SUPA_URL}/rest/v1/usuarios?condominio_id=eq.${CONDO_ID}&order=unidade,nome`,
    { headers: headers() }
  );

  moradores = res.ok ? await res.json() : [];
  renderStats();
  renderFiltroApto();
  renderCards();
}

// ================= UI =================
function renderStats() {
  const ativos = moradores.filter(m => m.ativo);
  const aptos = [...new Set(ativos.map(m => m.unidade))];

  document.getElementById('statAptos').textContent = aptos.length;
  document.getElementById('statAtivos').textContent = ativos.length;
  document.getElementById('statProprietarios').textContent =
    ativos.filter(m => m.tipo_ocupacao === 'proprietario').length;
  document.getElementById('statInquilinos').textContent =
    ativos.filter(m => m.tipo_ocupacao === 'inquilino').length;
}

function renderFiltroApto() {
  const sel = document.getElementById('filtroApto');
  const aptos = [...new Set(moradores.map(m => m.unidade).filter(Boolean))];

  sel.innerHTML =
    '<option value="">Todos os aptos</option>' +
    aptos.map(a => `<option value="${a}">Apto ${a}</option>`).join('');
}

// ================= CARDS (LAYOUT ORIGINAL) =================
function renderCards() {
  const busca = document.getElementById('busca').value.toLowerCase();
  const filtroApto = document.getElementById('filtroApto').value;
  const grid = document.getElementById('moradoresGrid');

  const lista = moradores.filter(m => {
    if (filtroApto && m.unidade !== filtroApto) return false;
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
    const contato = m.telefone
      ? m.telefone
      : (m.email ? m.email : 'Sem contato');

    const aptoLabel = m.bloco
      ? `Apto ${m.unidade} — Bloco ${m.bloco}`
      : `Apto ${m.unidade || '-'}`;

    return `
      <div class="morador-card">
        <div class="card-top">
          <div class="card-info">
            <div class="card-nome">${m.nome}</div>
            <div class="card-apto">${aptoLabel}</div>
            <div class="card-tipo">${m.tipo_ocupacao}</div>
          </div>
        </div>

        <div class="card-bottom">
          <div class="card-contato">${contato}</div>
          <div class="card-actions">
            <button class="btn-icon" onclick="abrirModal(${m.id})">✏</button>
            <button class="btn-icon del"
              onclick="deletar(${m.id}, '${m.nome.replace(/'/g,"\\'")}')">
              🗑
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ================= ACTIONS =================
function abrirModal(id) {
  alert('Abrir edição do morador ID: ' + id);
}

async function deletar(id, nome) {
  if (!confirm(`Excluir o morador "${nome}"?`)) return;

  const res = await fetch(
    `${SUPA_URL}/rest/v1/usuarios?id=eq.${id}`,
    { method: 'DELETE', headers: headers() }
  );

  if (res.ok) {
    moradores = moradores.filter(m => m.id !== id);
    renderCards();
  } else {
    alert('Erro ao excluir morador');
  }
