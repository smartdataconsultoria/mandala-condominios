import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://siczyohqmlrmirqgzlxb.supabase.co',
  'SUA_ANON_KEY_AQUI'
);

// ───────── ROLE (UX apenas) ─────────
let roleSelecionado = 'administradora';

window.selecionarRole = function(btn) {
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  roleSelecionado = btn.dataset.role;

  const labels = {
    administradora: 'Entrando como Administradora',
    sindico: 'Entrando como Síndico',
    morador: 'Entrando como Morador',
  };

  document.getElementById('role-label').textContent = labels[roleSelecionado];
  esconderErro();
};

// ───────── LOGIN ─────────
window.fazerLogin = async function (event) {
  event.preventDefault();
  esconderErro();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const btn = document.getElementById('btn-login');

  btn.disabled = true;
  btn.classList.add('loading');

  try {
    // 1️⃣ Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) {
      mostrarErro(traduzirErro(error.message));
      return;
    }

    // 2️⃣ Perfil no banco
    const { data: perfil, error: erroPerfil } = await supabase
      .from('usuarios')
      .select('role, ativo, status')
      .eq('id', data.user.id)
      .single();

    if (erroPerfil || !perfil) {
      mostrarErro('Perfil não encontrado. Contate o suporte.');
      await supabase.auth.signOut();
      return;
    }

    // 3️⃣ Controle REAL de acesso
    if (!perfil.ativo) {
      await supabase.auth.signOut();

      if (perfil.status === 'pendente') {
        mostrarErro('⏳ Seu cadastro está aguardando aprovação do síndico.');
      } else {
        mostrarErro('Conta desativada. Contate a administração.');
      }
      return;
    }

    // 4️⃣ Redireciona por role REAL
    const destinos = {
      administradora: '/admin/index.html',
      sindico: '/sindico/dashboard.html',
      morador: '/morador/index.html',
    };

    window.location.href = destinos[perfil.role];

  } catch (e) {
    console.error(e);
    mostrarErro('Erro inesperado. Tente novamente.');
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
  }
};

// ───────── MENSAGENS ─────────
function mostrarErro(msg) {
  const el = document.getElementById('erro');
  document.getElementById('erro-texto').textContent = msg;
  el.classList.add('show');
}

function esconderErro() {
  document.getElementById('erro').classList.remove('show');
}

// ✅ FUNÇÃO CORRIGIDA (sem bloquear por e-mail)
function traduzirErro(msg) {
  if (msg === 'Email not confirmed') {
    return 'Conta em sincronização. Tente novamente.';
  }

  const erros = {
    'Invalid login credentials': 'E-mail ou senha incorretos.',
    'Too many requests': 'Muitas tentativas. Aguarde alguns minutos.',
  };

  return erros[msg] ?? 'Erro ao fazer login.';
}

// ───────── AUTO-REDIRECT SE JÁ LOGADO ─────────
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (perfil?.role) {
    const destinos = {
      administradora: '/admin/index.html',
      sindico: '/sindico/dashboard.html',
      morador: '/morador/index.html',
    };

    window.location.href = destinos[perfil.role];
  }
}
