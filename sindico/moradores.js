// ── CONFIG ───────────────────────────────────────────────
const SUPA_URL      = 'https://siczyohqmlrmirqgzlxb.supabase.co';
const SUPA_KEY      = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpY3p5b2hxbWxybWlycWd6bHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NjE0MDksImV4cCI6MjA5MzIzNzQwOX0.JOf-VagxjdKNmC9MGU6MP6NvO6b1EBhzXirUdsjWYOw';
const SERVICE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpY3p5b2hxbWxybWlycWd6bHhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY2MTQwOSwiZXhwIjoyMDkzMjM3NDA5fQ.nSsFRGVG6pJBpYU_iCmonNAXk9Hd86cOd43XgusqOD0';
const CONDO_ID      = 'eefc41c0-519b-419b-847f-eb4724455baa';
const CONDO_NOME    = 'Edifício Mandala';

let _moradores = [];
let _filtro    = 'todos';
let _editId    = null;
let _fotoFile  = null;

// ── AUTH ─────────────────────────────────────────────────
function getToken(){
  const k = Object.keys(localStorage).find(k=>k.includes('auth-token'));
  if(!k) return null;
  try{
    const sess = JSON.parse(localStorage.getItem(k));
    const token = sess?.access_token;
    const exp   = sess?.expires_at;
    if(!token) return null;
    if(exp && Date.now()/1000 > exp) return null;
    return token;
  } catch{ return null; }
}
function hdrs(){
  const tk = getToken();
  return {'Content-Type':'application/json','apikey':SUPA_KEY,'Authorization':`Bearer ${tk||SUPA_KEY}`};
}

// ── UTILS ────────────────────────────────────────────────
function showAlert(msg,type='success'){
  const el=document.getElementById('alert');
  el.textContent=msg; el.className=`alert ${type}`; el.style.display='block';
  setTimeout(()=>el.style.display='none',4000);
}
function iniciais(nome){
  if(!nome) return '?';
  const p = nome.trim().split(' ');
  return (p[0][0]+(p[1]?p[1][0]:'')).toUpperCase();
}
function mascaraCpf(el){
  let v = el.value.replace(/\D/g,'').substring(0,11);
  v = v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
  el.value = v;
}
function mascaraTel(el){
  let v = el.value.replace(/\D/g,'').substring(0,11);
  v = v.length > 10
    ? v.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3')
    : v.replace(/(\d{2})(\d{4})(\d{4})/,'($1) $2-$3');
  el.value = v;
}

// ── LOAD ─────────────────────────────────────────────────
async function loadMoradores(){
  const res = await fetch(
    `${SUPA_URL}/rest/v1/usuarios?condominio_id=eq.${CONDO_ID}&order=unidade,nome`,
    {headers:hdrs()}
  );
  _moradores = res.ok ? await res.json() : [];
  renderStats();
  renderFiltroApto();
  renderCards();
}

function renderStats(){
  const ativos    = _moradores.filter(m=>m.ativo);
  const pendentes = _moradores.filter(m=>!m.ativo || m.status==='pendente');
  const aptos     = [...new Set(ativos.map(m=>m.unidade))].length;
  document.getElementById('statAptos').textContent        = aptos;
  document.getElementById('statAtivos').textContent       = ativos.length;
  document.getElementById('statProprietarios').textContent= ativos.filter(m=>m.role==='sindico'||m.role==='administradora').length;
  document.getElementById('statInquilinos').textContent   = ativos.filter(m=>m.role==='morador').length;
  // Pendentes
  const pendEl = document.getElementById('statPendentes');
  if(pendEl){
    pendEl.textContent = pendentes.length;
    pendEl.parentElement.style.display = pendentes.length > 0 ? 'block' : 'none';
  }
}

function renderFiltroApto(){
  const aptos = [...new Set(_moradores.map(m=>m.unidade).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  const sel = document.getElementById('filtroApto');
  sel.innerHTML = '<option value="">Todos os aptos</option>' +
    aptos.map(a=>`<option value="${a}">Apto ${a}</option>`).join('');
}

function setFiltro(f,el){
  _filtro = f;
  document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  renderCards();
}

function renderCards(){
  const busca    = document.getElementById('busca').value.toLowerCase();
  const filtApto = document.getElementById('filtroApto').value;

  let lista = _moradores.filter(m=>{
    if(_filtro==='ativo'        && !m.ativo) return false;
    if(_filtro==='inativo'      && m.ativo)  return false;
    if(_filtro==='proprietario' && m.tipo_ocupacao!=='proprietario') return false;
    if(_filtro==='inquilino'    && m.tipo_ocupacao!=='inquilino') return false;
    if(filtApto && m.unidade!==filtApto) return false;
    if(busca && !(
      m.nome?.toLowerCase().includes(busca) ||
      m.unidade?.toLowerCase().includes(busca) ||
      m.cpf?.includes(busca) ||
      m.email?.toLowerCase().includes(busca)
    )) return false;
    return true;
  });

  const grid = document.getElementById('moradoresGrid');
  if(lista.length===0){
    grid.innerHTML='<div class="empty-state">Nenhum morador encontrado.</div>';
    return;
  }

  grid.innerHTML = lista.map(m=>{
    const residentes = m.residentes || [];
    const pets       = m.pets || [];
    const tipoLabel  = m.tipo_ocupacao==='proprietario' ? 'Proprietário' : 'Inquilino';
    const aptoLabel  = m.bloco ? `Apto ${m.unidade} — Bloco ${m.bloco}` : m.unidade ? `Apto ${m.unidade}` : 'Sem apto';
    const avatarBg   = m.tipo_ocupacao==='proprietario'
      ? 'linear-gradient(135deg,#f5a623,#e09210)'
      : 'linear-gradient(135deg,#3b82f6,#1d4ed8)';

    return `<div class="morador-card" onclick="abrirModal(${m.id})">
      <div class="card-top">
        <div class="avatar" style="background:${avatarBg}">
          ${m.foto_url ? `<img src="${m.foto_url}" alt="${m.nome}"/>` : iniciais(m.nome)}
        </div>
        <div class="card-info">
          <div class="card-nome" title="${m.nome}">${m.nome}</div>
          <div class="card-apto">📍 ${aptoLabel}</div>
          <div class="card-tipo">${tipoLabel}${m.vaga_garagem ? ` • Vaga ${m.vaga_garagem}` : ''}</div>
          <div class="card-status">
            <span class="badge ${m.ativo?'ativo':'inativo'}">${m.ativo?'✓ Ativo':m.status==='pendente'?'⏳ Aguardando':'Inativo'}</span>
            <span class="badge ${m.tipo_ocupacao}">${tipoLabel}</span>
            ${residentes.length>0?`<span class="badge" style="background:#f1f5f9;color:#64748b">👥 +${residentes.length}</span>`:''}
            ${pets.length>0?`<span class="badge pet">🐾 ${pets.length} pet${pets.length>1?'s':''}</span>`:''}
            ${m.veiculo_placa?`<span class="badge veiculo">🚗 ${m.veiculo_placa}</span>`:''}
          </div>
        </div>
      </div>
      <hr class="card-divider"/>
      <div class="card-bottom">
        <div class="card-contato">${m.telefone||m.email||'Sem contato'}</div>
        <div class="card-actions" onclick="event.stopPropagation()">
          <button class="btn-icon" onclick="abrirModal(${m.id})" title="Editar">✏</button>
          <button class="btn-icon del" onclick="deletar(${m.id},'${m.nome.replace(/'/g,"\\'")}')">🗑</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── TABS DO MODAL ────────────────────────────────────────
function setTab(idx, el){
  document.querySelectorAll('.tab-content').forEach((t,i)=>t.classList.toggle('active',i===idx));
  document.querySelectorAll('.modal-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
}

// ── MODAL ────────────────────────────────────────────────
function abrirModal(id){
  _editId   = id || null;
  _fotoFile = null;
  limparModal();
  setTab(0, document.querySelectorAll('.modal-tab')[0]);

  if(id){
    const m = _moradores.find(m=>m.id===id);
    if(m) preencherModal(m);
    document.getElementById('modalTitle').textContent = 'Editar Morador';
    if(m?.email) setTimeout(()=>verificarEmailAuth('1'), 200);
  } else {
    document.getElementById('modalTitle').textContent = 'Cadastrar Morador';
  }
  document.getElementById('modalBg').classList.add('open');
}

function fecharModal(){
  document.getElementById('modalBg').classList.remove('open');
  _editId = null; _fotoFile = null;
}

function limparModal(){
  ['fNome','fCpf','fRg','fEmail','fEmail2','fTel','fTel2','fApto','fBloco',
   'fEntrada','fSaida','fPlaca','fModelo','fCorVei','fVaga',
   'fEmergNome','fEmergTel','fObs','fNasc'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('fTipoOcup').value = 'morador';
  document.getElementById('fEmergPar').value = '';
  document.getElementById('fAtivo').checked  = true;
  ['','2'].forEach(function(sfx){
    const chk = document.getElementById('fCriarAcesso'+sfx);
    if(chk){ chk.checked=false; chk.disabled=false; }
    const campo = document.getElementById('campoSenha'+sfx);
    if(campo) campo.style.display='none';
    const senha = document.getElementById('fSenha'+sfx);
    if(senha) senha.value='';
    const status = document.getElementById('statusAcessoPortal'+sfx);
    if(status) status.style.display='none';
  });
  document.getElementById('fTemPet').checked = false;
  document.getElementById('petsArea').style.display = 'none';
  document.getElementById('listaResidentes').innerHTML = '';
  document.getElementById('listaPets').innerHTML = '';
  document.getElementById('fotoPreview').innerHTML = '👤';
}

function preencherModal(m){
  const set = (id,v) => { const el=document.getElementById(id); if(el&&v!=null) el.value=v; };
  set('fNome',m.nome);
  set('fEmail',m.email);
  set('fTel',m.telefone||'');
  set('fApto',m.unidade||'');
  set('fBloco',m.bloco);
  set('fTipoOcup',m.role||'morador');
  if(m.ativo!=null) document.getElementById('fAtivo').checked = m.ativo;
}

// ── FOTO ─────────────────────────────────────────────────
function onFotoChange(){
  const file = document.getElementById('fFoto').files[0];
  if(!file) return;
  if(file.size>2*1024*1024){ showAlert('Foto muito grande. Máx 2MB.','error'); return; }
  _fotoFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('fotoPreview').innerHTML = `<img src="${e.target.result}" alt="foto"/>`;
  };
  reader.readAsDataURL(file);
}

// ── RESIDENTES DINÂMICOS ─────────────────────────────────
function addResidente(dados){
  const d  = dados || {};
  const el = document.createElement('div');
  el.className = 'lista-item';
  el.innerHTML = `
    <button class="remove-item" onclick="removeItem(this,'listaResidentes')">✕</button>
    <div class="grid3">
      <div class="field" style="margin:0"><label>Nome</label>
        <input type="text" class="r-nome" placeholder="Nome completo" value="${d.nome||''}"/></div>
      <div class="field" style="margin:0"><label>Parentesco</label>
        <select class="r-par">
          ${['Cônjuge','Filho(a)','Pai/Mãe','Irmão/Irmã','Avô/Avó','Neto(a)','Outro']
            .map(p=>`<option${d.parentesco===p?' selected':''}>${p}</option>`).join('')}
        </select></div>
      <div class="field" style="margin:0"><label>CPF</label>
        <input type="text" class="r-cpf" placeholder="000.000.000-00" value="${d.cpf||''}" oninput="mascaraCpf(this)"/></div>
    </div>`;
  document.getElementById('listaResidentes').appendChild(el);
}

// ── PETS DINÂMICOS ───────────────────────────────────────
function togglePets(){
  const on = document.getElementById('fTemPet').checked;
  document.getElementById('petsArea').style.display = on ? 'block' : 'none';
}

function addPet(dados){
  const d  = dados || {};
  const el = document.createElement('div');
  el.className = 'lista-item';
  el.innerHTML = `
    <button class="remove-item" onclick="removeItem(this,'listaPets')">✕</button>
    <div class="grid3">
      <div class="field" style="margin:0"><label>Nome do Pet</label>
        <input type="text" class="p-nome" placeholder="Ex: Rex" value="${d.nome||''}"/></div>
      <div class="field" style="margin:0"><label>Espécie</label>
        <select class="p-esp">
          ${['Cão','Gato','Ave','Peixe','Outro']
            .map(e=>`<option${d.especie===e?' selected':''}>${e}</option>`).join('')}
        </select></div>
      <div class="field" style="margin:0"><label>Raça</label>
        <input type="text" class="p-raca" placeholder="Ex: Labrador" value="${d.raca||''}"/></div>
    </div>`;
  document.getElementById('listaPets').appendChild(el);
}

function removeItem(btn, listaId){
  btn.closest('.lista-item').remove();
}

function coletarResidentes(){
  return [...document.querySelectorAll('#listaResidentes .lista-item')].map(el=>({
    nome:       el.querySelector('.r-nome')?.value?.trim()||'',
    parentesco: el.querySelector('.r-par')?.value||'',
    cpf:        el.querySelector('.r-cpf')?.value?.trim()||''
  })).filter(r=>r.nome);
}
function coletarPets(){
  return [...document.querySelectorAll('#listaPets .lista-item')].map(el=>({
    nome:    el.querySelector('.p-nome')?.value?.trim()||'',
    especie: el.querySelector('.p-esp')?.value||'',
    raca:    el.querySelector('.p-raca')?.value?.trim()||''
  })).filter(p=>p.nome);
}

// ── UPLOAD FOTO ───────────────────────────────────────────
async function uploadFoto(file, moradorId){
  const ext  = file.name.split('.').pop();
  const path = `mandala/moradores/${moradorId}.${ext}`;
  const res  = await fetch(`${SUPA_URL}/storage/v1/object/moradores-fotos/${path}`,{
    method:'POST',
    headers:{'apikey':SUPA_KEY,'Authorization':`Bearer ${getToken()||SUPA_KEY}`,'Content-Type':file.type},
    body:file
  });
  return res.ok ? `${SUPA_URL}/storage/v1/object/public/moradores-fotos/${path}` : null;
}

// ── ACESSO AO PORTAL ─────────────────────────────────────
function toggleSenha(inputId){
  const inp = document.getElementById(inputId||'fSenha');
  if(inp) inp.type = inp.type==='password' ? 'text' : 'password';
}

function toggleCampoSenha(num){
  const sfx     = num==='2' ? '2' : '';
  const checked = document.getElementById('fCriarAcesso'+sfx).checked;
  const campo   = document.getElementById('campoSenha'+sfx);
  if(campo) campo.style.display = checked ? 'block' : 'none';
  const fSenha  = document.getElementById('fSenha'+sfx);
  if(fSenha && !checked) fSenha.value='';
}

async function verificarEmailAuth(num){
  const sfx    = num==='2' ? '2' : '';
  const email  = document.getElementById('fEmail'+sfx)?.value.trim();
  const status = document.getElementById('statusAcessoPortal'+sfx);
  const chk    = document.getElementById('fCriarAcesso'+sfx);
  if(!status || !chk) return;
  if(!email || !email.includes('@')){ status.style.display='none'; return; }
  try{
    // Verificar se email já existe no Auth via tabela usuarios
    const r = await fetch(
      `${SUPA_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(email)}&condominio_id=eq.${CONDO_ID}&select=email,role`,
      { headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY} }
    );
    if(r.ok){
      const d = await r.json();
      if(d.length>0){
        status.innerHTML = '✅ E-mail já cadastrado como <strong>'+(d[0].role||'morador')+'</strong>';
        status.style.cssText='display:block;color:#16a34a;font-size:11px;margin-top:4px';
        chk.checked=false; toggleCampoSenha(num); chk.disabled=true;
        return;
      }
    }
    status.innerHTML = '○ E-mail ainda sem acesso ao portal';
    status.style.cssText='display:block;color:#94a3b8;font-size:11px;margin-top:4px';
    chk.disabled=false;
  } catch(e){ status.style.display='none'; }
}

async function criarAcessoPortal(email, nome, apto, sfxNum){
  const sfx   = sfxNum==='2' ? '2' : '';
  const senha = document.getElementById('fSenha'+sfx).value.trim();
  if(!senha || senha.length<6){
    showAlert('A senha deve ter no mínimo 6 caracteres.','error');
    return false;
  }
  // Criar conta no Supabase Auth (signup público)
  const rAuth = await fetch(`${SUPA_URL}/auth/v1/signup`,{
    method:'POST',
    headers:{'apikey':SUPA_KEY,'Content-Type':'application/json'},
    body: JSON.stringify({email, password: senha, data:{ full_name: nome }})
  });
  const dAuth = await rAuth.json().catch(()=>({}));
  if(!rAuth.ok){
    const msg = dAuth.message||dAuth.msg||'';
    if(!msg.toLowerCase().includes('already registered')){
      showAlert('❌ Erro ao criar acesso: '+msg,'error');
      return false;
    }
    // Email já existe no Auth — ok, continua
  }
  // Garantir registro na tabela usuarios com ativo=true
  // Atualizar registro existente com ativo=true (não duplicar)
  await fetch(`${SUPA_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(email)}&condominio_id=eq.${CONDO_ID}`,{
    method:'PATCH',
    headers:hdrs(),
    body: JSON.stringify({ ativo: true, status: 'aprovado' })
  });
  return true;
}

// ── SALVAR ────────────────────────────────────────────────
async function salvar(){
  const nome = document.getElementById('fNome').value.trim();
  const apto = document.getElementById('fApto').value.trim();
  if(!nome){ showAlert('Informe o nome do morador.','error'); setTab(0,document.querySelectorAll('.modal-tab')[0]); return; }
  if(!apto){ showAlert('Informe o número do apartamento.','error'); setTab(1,document.querySelectorAll('.modal-tab')[1]); return; }

  const btn = document.getElementById('btnSalvar');
  btn.disabled=true; btn.textContent='Salvando...';

  const emailVal = document.getElementById('fEmail').value.trim();
  const roleVal  = document.getElementById('fTipoOcup').value || 'morador';
  const ativo    = document.getElementById('fAtivo').checked;
  const h = hdrs();

  try {
    // ── EDIÇÃO: só atualiza campos permitidos ─────────────────────────────────
    if(_editId){
      const patchData = {
        nome,
        telefone: document.getElementById('fTel').value.trim()||null,
        unidade:  apto||null,
        bloco:    document.getElementById('fBloco').value.trim()||null,
        role:     roleVal,
        ativo,
        status:   ativo ? 'aprovado' : 'pendente',
      };
      if(emailVal) patchData.email = emailVal;

      const res  = await fetch(`${SUPA_URL}/rest/v1/usuarios?id=eq.${_editId}`,{
        method:'PATCH', headers:{...h,'Prefer':'return=representation'}, body:JSON.stringify(patchData)
      });
      const json = await res.json();
      if(!res.ok){
        const msg = (Array.isArray(json)?json[0]:json)?.message || JSON.stringify(json);
        showAlert(`❌ Erro ao atualizar: ${msg}`, 'error');
        btn.disabled=false; btn.textContent='💾 Salvar Morador'; return;
      }

      // Criar acesso se solicitado
      const criarAcesso = document.getElementById('fCriarAcesso')?.checked;
      if(criarAcesso && emailVal){
        btn.textContent='Criando acesso...';
        await criarAcessoPortal(emailVal, nome, apto, '');
      }

      showAlert('✅ Morador atualizado!');
      fecharModal();
      await loadMoradores();
      btn.disabled=false; btn.textContent='💾 Salvar Morador';
      return;
    }

    // ── NOVO CADASTRO: precisa criar no Auth primeiro ─────────────────────────
    if(!emailVal){
      showAlert('Informe o e-mail para criar o cadastro.','error');
      setTab(0,document.querySelectorAll('.modal-tab')[0]);
      btn.disabled=false; btn.textContent='💾 Salvar Morador'; return;
    }

    const criarAcesso = document.getElementById('fCriarAcesso')?.checked;
    const senha = document.getElementById('fSenha')?.value.trim();

    if(!criarAcesso || !senha || senha.length < 6){
      showAlert('Para cadastrar um novo morador, marque "Criar senha de acesso" e defina uma senha de pelo menos 6 caracteres.','error');
      setTab(0,document.querySelectorAll('.modal-tab')[0]);
      btn.disabled=false; btn.textContent='💾 Salvar Morador'; return;
    }

    // 1. Criar no Supabase Auth via Admin API (sem limite de email, sem confirmação)
    btn.textContent='Criando conta...';
    const rAuth = await fetch(`${SUPA_URL}/auth/v1/admin/users`,{
      method:'POST',
      headers:{
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email:          emailVal,
        password:       senha,
        email_confirm:  true,   // confirma automaticamente sem enviar email
        user_metadata:  { full_name: nome }
      })
    });
    const dAuth = await rAuth.json();

    if(!rAuth.ok){
      const msg = dAuth.message||dAuth.msg||dAuth.error_description||'Erro ao criar conta.';
      if(msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')){
        // Email já existe — buscar o UUID existente
        btn.textContent='Buscando conta existente...';
        const rList = await fetch(`${SUPA_URL}/auth/v1/admin/users?email=${encodeURIComponent(emailVal)}`,{
          headers:{'apikey':SERVICE_KEY,'Authorization':`Bearer ${SERVICE_KEY}`}
        });
        const dList = await rList.json();
        const existingUser = dList?.users?.[0];
        if(existingUser?.id){
          // Continua com o UUID existente
          const payload = {
            id:            existingUser.id,
            condominio_id: CONDO_ID,
            nome,
            email:         emailVal,
            telefone:      document.getElementById('fTel').value.trim()||null,
            unidade:       apto||null,
            bloco:         document.getElementById('fBloco').value.trim()||null,
            role:          roleVal,
            ativo,
            status:        ativo ? 'aprovado' : 'pendente',
          };
          const res2 = await fetch(`${SUPA_URL}/rest/v1/usuarios`,{
            method:'POST', headers:{...h,'Prefer':'return=representation'}, body:JSON.stringify(payload)
          });
          if(res2.ok || res2.status===409){
            showAlert('✅ Morador cadastrado! (conta já existia no sistema)');
            fecharModal(); await loadMoradores();
          } else {
            showAlert('❌ E-mail já cadastrado neste condomínio.','error');
          }
          btn.disabled=false; btn.textContent='💾 Salvar Morador'; return;
        }
        showAlert('❌ E-mail já cadastrado. Verifique se este morador já existe.','error');
      } else {
        showAlert('❌ Erro ao criar conta: '+msg,'error');
      }
      btn.disabled=false; btn.textContent='💾 Salvar Morador'; return;
    }

    const authId = dAuth?.id || dAuth?.user?.id;
    if(!authId){
      showAlert('❌ Não foi possível obter o ID do usuário criado.','error');
      btn.disabled=false; btn.textContent='💾 Salvar Morador'; return;
    }

    // 2. Inserir em usuarios com o ID do Auth
    btn.textContent='Salvando cadastro...';
    const payload = {
      id:            authId,
      condominio_id: CONDO_ID,
      nome,
      email:         emailVal,
      telefone:      document.getElementById('fTel').value.trim()||null,
      unidade:       apto||null,
      bloco:         document.getElementById('fBloco').value.trim()||null,
      role:          roleVal,
      ativo,
      status:        ativo ? 'aprovado' : 'pendente',
    };

    const res  = await fetch(`${SUPA_URL}/rest/v1/usuarios`,{
      method:'POST', headers:{...h,'Prefer':'return=representation'}, body:JSON.stringify(payload)
    });
    const json = await res.json();

    if(!res.ok){
      const msg = (Array.isArray(json)?json[0]:json)?.message || JSON.stringify(json);
      showAlert(`❌ Conta criada mas erro ao salvar dados: ${msg}`, 'error');
      btn.disabled=false; btn.textContent='💾 Salvar Morador'; return;
    }

    showAlert('✅ Morador cadastrado com acesso ao portal!');
    fecharModal();
    await loadMoradores();
  } catch(e){
    showAlert('❌ Erro: '+e.message,'error');
  }
  btn.disabled=false; btn.textContent='💾 Salvar Morador';
}

// ── APROVAR MORADOR ──────────────────────────────────────────────────────────
async function aprovarMorador(id, nome){
  if(!confirm(`Aprovar o cadastro de "${nome}"?\nEle receberá acesso ao portal.`)) return;
  const res = await fetch(
    `${SUPA_URL}/rest/v1/usuarios?id=eq.${id}&condominio_id=eq.${CONDO_ID}`,
    {method:'PATCH', headers:hdrs(), body:JSON.stringify({ativo:true})}
  );
  if(res.ok){
    showAlert(`✅ ${nome} aprovado com sucesso!`);
    await loadMoradores();
  } else {
    showAlert('Erro ao aprovar morador.','error');
  }
}

// ── DELETAR ───────────────────────────────────────────────
async function deletar(id, nome){
  if(!confirm(`Excluir o morador "${nome}"?\nEsta ação não pode ser desfeita.`)) return;
  const res = await fetch(
    `${SUPA_URL}/rest/v1/usuarios?id=eq.${id}&condominio_id=eq.${CONDO_ID}`,
    {method:'DELETE', headers:{...hdrs(),'Prefer':'return=representation'}}
  );
  if(res.ok){ showAlert('Morador removido.'); await loadMoradores(); }
  else showAlert('Erro ao remover.','error');
}

// ── FECHAR AO CLICAR FORA ────────────────────────────────
document.getElementById('modalBg').addEventListener('click',e=>{
  if(e.target===document.getElementById('modalBg')) fecharModal();
});

// ── INIT ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async ()=>{
  const k = Object.keys(localStorage).find(k=>k.includes('auth-token'));
  if(k){
    try{
      const u = JSON.parse(localStorage.getItem(k));
      document.getElementById('navUser').textContent = u?.user?.email || 'Síndico';
    }catch{}
  }
  // Nome do condomínio
  document.getElementById('condoNome').innerHTML =
    CONDO_NOME + ' <svg viewBox="0 0 20 20" style="width:12px;height:12px;fill:#64748b;flex-shrink:0"><path d="M5 8l5 5 5-5"/></svg>';

  await loadMoradores();
});
