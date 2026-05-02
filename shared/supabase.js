// ============================================================
// shared/supabase.js
// Conexão centralizada com o Supabase.
// Todos os outros arquivos importam daqui — mude só aqui
// se precisar trocar de projeto ou atualizar as chaves.
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// -----------------------------------------------------------
// ATENÇÃO: substitua os valores abaixo pelos do seu projeto.
// Encontre em: supabase.com → seu projeto → Project Settings → API
// -----------------------------------------------------------
const SUPABASE_URL  = 'https://siczyohqmlrmirqgzlxb.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpY3p5b2hxbWxybWlycWd6bHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NjE0MDksImV4cCI6MjA5MzIzNzQwOX0.JOf-VagxjdKNmC9MGU6MP6NvO6b1EBhzXirUdsjWYOw'
// -----------------------------------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

