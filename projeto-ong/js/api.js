/* ============================================================
   api.js — Camada de dados da área administrativa
   ------------------------------------------------------------
   ESTE É O ÚNICO ARQUIVO QUE MUDA QUANDO O BACK-END EXISTIR.

   Hoje: dados em memória (demonstração).
   Depois: troque o corpo de cada função por chamadas fetch().

   Contrato combinado com as Pessoas 3 e 4:

     POST   /api/login            { email, senha }        -> { token, usuario }
     POST   /api/logout                                    -> { ok: true }
     GET    /api/animais                                   -> [ animal, ... ]
     POST   /api/animais          (animal sem id)          -> animal criado
     PUT    /api/animais/:id      (animal com id)          -> animal atualizado
     DELETE /api/animais/:id                               -> { ok: true }
     GET    /api/eventos                                   -> [ evento, ... ]
     POST   /api/eventos          (evento sem id)          -> evento criado
     PUT    /api/eventos/:id      (evento com id)          -> evento atualizado
     DELETE /api/eventos/:id                               -> { ok: true }
     GET    /api/voluntarios                               -> [ inscricao, ... ]
     PATCH  /api/voluntarios/:id  { status }               -> inscricao
     GET    /api/estatisticas                              -> { ... }

   Todas as chamadas protegidas enviam o cabeçalho:
     Authorization: Bearer <token>
   ============================================================ */

const API = (() => {

  // ----------------------------------------------------------
  // CONFIGURAÇÃO
  // ----------------------------------------------------------
  // Quando o back-end subir, aponte para a URL real:
  // const BASE_URL = 'http://localhost:3000';
  // E mude MODO_DEMO para false.
  const BASE_URL = '';
  const MODO_DEMO = false;

  const CHAVE_SESSAO = 'lacos_admin_sessao';

  // Cabeçalhos comuns a toda requisição autenticada
  function cabecalhos() {
    const h = { 'Content-Type': 'application/json' };
    const token = sessionStorage.getItem(CHAVE_SESSAO);
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  }

  // ----------------------------------------------------------
  // DADOS DE DEMONSTRAÇÃO
  // ----------------------------------------------------------
  // Espelham exatamente as colunas que a Pessoa 4 vai criar nas
  // tabelas, para a integração não exigir renomear nada.

  const usuarios = [
    { id: 1, nome: 'Administrador', email: 'admin@lacosdeamor.org', senha: 'admin123', papel: 'admin' }
  ];

  let animais = [
    { id: 1, nome: 'Angel',  especie: 'Cão', raca: 'SRD',  idade: 12, porte: 'Grande', sexo: 'Fêmea', status: 'Disponível', descricao: 'Doce e muito carinhosa.' },
    { id: 2, nome: 'Bella',  especie: 'Cão', raca: 'SRD',  idade: 13, porte: 'Grande', sexo: 'Fêmea', status: 'Disponível', descricao: 'Brincalhona e adora colo.' },
    { id: 3, nome: 'Thor',   especie: 'Cão', raca: 'SRD',  idade: 5,  porte: 'Médio',  sexo: 'Macho', status: 'Disponível', descricao: 'Brincalhão e ótimo com crianças.' },
    { id: 4, nome: 'Mia',    especie: 'Gato', raca: 'SRD', idade: 2,  porte: 'Pequeno', sexo: 'Fêmea', status: 'Adotado',   descricao: 'Tímida no começo, muito carinhosa depois.' },
    { id: 5, nome: 'Simba',  especie: 'Gato', raca: 'SRD', idade: 4,  porte: 'Pequeno', sexo: 'Macho', status: 'Disponível', descricao: 'Adora um colo e dorme o dia todo.' }
  ];

  let eventos = [
    { id: 1, titulo: 'Feirinha de Adoção no IB Bragion', descricao: 'Leve caixa de transporte e documento com foto.', data: '2026-12-06', hora: '10:00', local: 'IB Bragion', status: 'Publicado' },
    { id: 2, titulo: 'Bazar Beneficente',                descricao: 'Toda a renda vai para ração e tratamento veterinário.', data: '2026-12-20', hora: '09:00', local: 'Praça Central', status: 'Publicado' }
  ];

  let voluntarios = [
    { id: 1, nome: 'Ana Souza',    email: 'ana.souza@email.com',    telefone: '(14) 99811-2233', disponibilidade: 'Fins de semana pela manhã', mensagem: 'Já trabalhei com resgate de gatos.', data_envio: '2026-11-02', status: 'nova' },
    { id: 2, nome: 'Bruno Lima',   email: 'bruno.lima@email.com',   telefone: '(14) 99722-4455', disponibilidade: 'Terças e quintas à noite',   mensagem: 'Posso ajudar com transporte.',      data_envio: '2026-11-04', status: 'lida' },
    { id: 3, nome: 'Carla Mendes', email: 'carla.mendes@email.com', telefone: '(14) 99633-7788', disponibilidade: 'Disponibilidade total',      mensagem: 'Sou veterinária e quero ajudar.',   data_envio: '2026-11-07', status: 'nova' }
  ];

  // ----------------------------------------------------------
  // UTILITÁRIOS
  // ----------------------------------------------------------
  const espera = (ms = 180) => new Promise(r => setTimeout(r, ms));

  // Gera o próximo id disponível
  const proximoId = lista => lista.length ? Math.max(...lista.map(i => i.id)) + 1 : 1;

  // Simula o atraso e o formato de resposta de uma API real.
  // Quando o back existir, troque o corpo inteiro por:
  //   const r = await fetch(BASE_URL + rota, { method, headers: cabecalhos(), body: JSON.stringify(dados) });
  //   if (!r.ok) throw new Error('Erro ' + r.status);
  //   return r.json();
  async function simular(rota, metodo = 'GET', dados = null) {
    await espera();
    const chave = rota.split('/')[2].split('?')[0];        // ex.: 'animais'
    const matchId = rota.match(/\/api\/\w+\/(\d+)/);
    const id = matchId ? Number(matchId[1]) : null;

    const colecoes = { animais, eventos, voluntarios: voluntarios };
    const conjuntos = { animais: () => animais, eventos: () => eventos, voluntarios: () => voluntarios };

    if (chave === 'estatisticas') {
      return {
        animais_disponiveis: animais.filter(a => a.status === 'Disponível').length,
        animais_adotados:    animais.filter(a => a.status === 'Adotado').length,
        eventos_publicados:  eventos.filter(e => e.status === 'Publicado').length,
        voluntarios_novas:   voluntarios.filter(v => v.status === 'nova').length,
        voluntarios_total:   voluntarios.length
      };
    }

    if (!colecoes[chave]) throw new Error('Rota desconhecida: ' + rota);

    if (metodo === 'GET') return conjuntos[chave]().slice();

    if (metodo === 'POST') {
      const novo = { ...dados, id: proximoId(colecoes[chave]) };
      colecoes[chave].push(novo);
      return novo;
    }

    if (metodo === 'PUT') {
      const lista = conjuntos[chave]();
      const i = lista.findIndex(x => x.id === id);
      if (i === -1) throw new Error('Registro não encontrado');
      lista[i] = { ...lista[i], ...dados, id };
      return lista[i];
    }

    if (metodo === 'PATCH') {
      const lista = conjuntos[chave]();
      const i = lista.findIndex(x => x.id === id);
      if (i === -1) throw new Error('Registro não encontrado');
      lista[i] = { ...lista[i], ...dados };
      return lista[i];
    }

    if (metodo === 'DELETE') {
      const lista = conjuntos[chave]();
      const i = lista.findIndex(x => x.id === id);
      if (i === -1) throw new Error('Registro não encontrado');
      lista.splice(i, 1);
      return { ok: true };
    }

    throw new Error('Método não suportado: ' + metodo);
  }

  // ----------------------------------------------------------
  // AUTENTICAÇÃO
  // ----------------------------------------------------------
  async function login(email, senha) {
  // Envia o e-mail e a senha para o backend.
  const resposta = await fetch(BASE_URL + '/api/login', {
    //Envia os dados de login ao backend e espera a resposta
    method: 'POST',
    //Define o método HTTP usado para enviar as credenciais
    headers: { 'Content-Type': 'application/json' },
    //Informa ao Express que o conteúdo enviado está em formato JSON
    body: JSON.stringify({ email, senha })
    //Transforma o objeto JavaScript com e-mail e senha em uma string JSON
  });

  // Verifica se o servidor aceitou o login.
  if (!resposta.ok) {
    throw new Error('E-mail ou senha incorretos.');
  }

  // Converte a resposta JSON em um objeto JavaScript.
  const sessao = await resposta.json();

  // Guarda o token temporariamente no navegador.
  sessionStorage.setItem(CHAVE_SESSAO, sessao.token);

  // Guarda os dados do administrador para o painel.
  sessionStorage.setItem(CHAVE_SESSAO + '_usuario',JSON.stringify(sessao.usuario));
  //Permite que o painel identifique o administrador que entrou

  // Devolve a sessão para o código que chamou o login.
  return sessao;
}

  function logout() {
    sessionStorage.removeItem(CHAVE_SESSAO);
    sessionStorage.removeItem(CHAVE_SESSAO + '_usuario');
  }

  function usuarioAtual() {
    const bruto = sessionStorage.getItem(CHAVE_SESSAO + '_usuario');
    return bruto ? JSON.parse(bruto) : null;
  }

  // Usada no topo das páginas admin: redireciona para o login se não houver sessão
  function exigirLogin() {
    if (!usuarioAtual()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  // ----------------------------------------------------------
  // API PÚBLICA
  // ----------------------------------------------------------
  return {
    BASE_URL,
    MODO_DEMO,
    login,
    logout,
    usuarioAtual,
    exigirLogin,

    listarAnimais: async () => {
      // Busca os animais reais cadastrados no MySQL através do backend.
      const resposta = await fetch(BASE_URL + '/api/animais');
      // Verifica se o servidor respondeu corretamente.
      if (!resposta.ok) {
        throw new Error('Não foi possível carregar os animais.');}
      // Converte o JSON recebido em dados JavaScript.
      const animaisDoBanco = await resposta.json();
      // Devolve a lista para o painel administrativo.
      return animaisDoBanco;
},
    salvarAnimal: async (animal, arquivoFoto) => {
      // Prepara os campos e a foto para envio.
      const dadosFormulario = new FormData();
      // Adiciona os dados do animal.
      dadosFormulario.append('nome', animal.nome);
      dadosFormulario.append('especie', animal.especie);
      dadosFormulario.append('raca', animal.raca);
      dadosFormulario.append('idade', animal.idade);
      dadosFormulario.append('meses', animal.meses);
      dadosFormulario.append('porte', animal.porte);
      dadosFormulario.append('sexo', animal.sexo);
      dadosFormulario.append('status', animal.status);
      dadosFormulario.append('descricao', animal.descricao);
      // Adiciona a foto, caso tenha sido selecionada.
      if (arquivoFoto) {
        dadosFormulario.append('foto', arquivoFoto);
      }// Recupera o token do administrador.
      const token = sessionStorage.getItem(CHAVE_SESSAO);
      // Envia os dados ao backend.
      // Verifica se o animal já existe no banco de dados.
      const editando = animal.id != null;
      // Escolhe o endereço para cadastrar ou editar.
      const endereco = editando? BASE_URL + '/api/animais/' + animal.id: BASE_URL + '/api/animais';
      // Envia os dados ao backend.
      const resposta = await fetch(endereco, {
        method: editando ? 'PUT' : 'POST',
        headers: {Authorization: 'Bearer ' + token},body: dadosFormulario
      });
      // Lê a resposta do servidor.
      const dados = await resposta.json();
      // Verifica se ocorreu algum erro.
      if (!resposta.ok) {
        throw new Error(dados.erro || 'Não foi possível salvar o animal.');
      }
      return dados;
    },
    
    excluirAnimal: async (id) => {
      // Recupera o token do administrador.
      const token = sessionStorage.getItem(CHAVE_SESSAO);
      // Solicita a exclusão do animal ao backend.
      const resposta = await fetch(BASE_URL + '/api/animais/' + id, {
        method: 'DELETE',
        headers: {Authorization: 'Bearer ' + token}
      });
      // Lê a resposta enviada pelo servidor.
      const dados = await resposta.json();
      // Verifica se ocorreu algum erro.
      if (!resposta.ok) {
        throw new Error(dados.erro || 'Não foi possível excluir o animal.');
      }
      // Retorna a confirmação.
      return dados;
    },

    listarEventos: async () => {
      //função responsável por buscar os eventos
      // Busca os eventos cadastrados no MySQL.
      const resposta = await fetch(BASE_URL + '/api/eventos');
      // Verifica se a consulta funcionou.
      if (!resposta.ok) {
        throw new Error('Não foi possível carregar os eventos.');
      }
      // Converte a resposta em uma lista JavaScript.
      const eventosDoBanco = await resposta.json();
      // Devolve os eventos para o painel administrativo.
      return eventosDoBanco;
    },
    salvarEvento: async (evento) => {
      // Recupera o token do administrador.
      const token = sessionStorage.getItem(CHAVE_SESSAO);
      // Envia os dados do evento para o backend.
      // Verifica se estamos editando um evento existente.
      const editando = evento.id != null;
      //Verifica se o evento já possui um ID
      // Escolhe a rota de cadastro ou edição.
      const endereco = editando? BASE_URL + '/api/eventos/' + evento.id: BASE_URL + '/api/eventos';
      //editar o evento de ID 1, ou /api/eventos para cadastrar um novo
      // Envia os dados para o backend.
      const resposta = await fetch(endereco, {
        method: editando ? 'PUT' : 'POST',
        //Informa que queremos cadastrar um evento novo
        headers: {'Content-Type': 'application/json',Authorization: 'Bearer ' + token},
        body: JSON.stringify(evento)});
      // Lê a resposta enviada pelo servidor.
      const dados = await resposta.json();
      // Verifica se ocorreu algum erro.
      if (!resposta.ok) {
        throw new Error(dados.erro || 'Não foi possível cadastrar o evento.');
      }
      // Devolve a confirmação do cadastro.
      return dados;
    },
    excluirEvento: async (id) => {
      // Recupera o token do administrador.
      const token = sessionStorage.getItem(CHAVE_SESSAO);
      // Envia o pedido de exclusão ao backend.
      const resposta = await fetch(BASE_URL + '/api/eventos/' + id, {
        method: 'DELETE',
        headers: {Authorization: 'Bearer ' + token}
      });
      // Lê a resposta do servidor.
      const dados = await resposta.json();
      // Verifica se ocorreu algum erro.
      if (!resposta.ok) {
        throw new Error(dados.erro || 'Não foi possível excluir o evento.');
      }
      // Devolve a confirmação da exclusão.
      return dados;
    },

    listarVoluntarios: async () => {
      // Recupera o token do administrador.
      const token = sessionStorage.getItem(CHAVE_SESSAO);
      // Busca os voluntários reais no backend.
      const resposta = await fetch(BASE_URL + '/api/voluntarios', {
        headers: {Authorization: 'Bearer ' + token}
      });
      // Lê os dados enviados pelo servidor.
      const dados = await resposta.json();
      // Verifica se a consulta funcionou.
      if (!resposta.ok) {
        throw new Error(dados.erro || 'Não foi possível carregar os voluntários.');
      }
      // Devolve os voluntários cadastrados no MySQL.
      return dados;
    },
    excluirVoluntario: async (id) => {
      // Recupera o token do administrador.
      const token = sessionStorage.getItem(CHAVE_SESSAO);
      // Solicita a exclusão da inscrição no backend.
      const resposta = await fetch(BASE_URL + '/api/voluntarios/' + id, {
        method: 'DELETE',
        headers: {Authorization: 'Bearer ' + token}});
        // Lê a resposta enviada pelo servidor.
        const dados = await resposta.json();
        // Verifica se ocorreu algum erro.
        if (!resposta.ok) {
          throw new Error(dados.erro || 'Não foi possível excluir a inscrição.');
        }
        // Devolve a confirmação da exclusão.
        return dados;
      },

    estatisticas: async () => {
      // Recupera o token do administrador.
      const token = sessionStorage.getItem(CHAVE_SESSAO);
      // Consulta as estatísticas reais no backend.
      const resposta = await fetch(BASE_URL + '/api/estatisticas', {
        headers: {Authorization: 'Bearer ' + token}
      });
      // Lê a resposta do servidor.
      const dados = await resposta.json();
      // Verifica se a consulta funcionou.
      if (!resposta.ok) {
        throw new Error(dados.erro || 'Erro ao carregar estatísticas.');
      }
      // Devolve os números para o dashboard.
      return dados;
    },

    // ----------------------------------------------------------
// GERENCIAMENTO DE USUÁRIOS
// ----------------------------------------------------------

// Busca todos os usuários cadastrados no sistema.
listarUsuarios: async () => {

  // Solicita a lista de usuários ao backend.
  const resposta = await fetch(BASE_URL + '/api/usuarios', {
    method: 'GET',
    headers: cabecalhos()
  });

  // Converte a resposta do servidor em JavaScript.
  const dados = await resposta.json();

  // Verifica se a consulta funcionou.
  if (!resposta.ok) {
    throw new Error(dados.erro || 'Não foi possível carregar os usuários.');
  }

  // Devolve a lista de usuários.
  return dados;
},

// Cadastra um usuário comum ou administrador principal.
cadastrarUsuario: async (usuario) => {

  // Envia os dados do novo usuário ao backend.
  const resposta = await fetch(BASE_URL + '/api/usuarios', {
    method: 'POST',
    headers: cabecalhos(),
    body: JSON.stringify(usuario)
  });

  // Lê a resposta enviada pelo servidor.
  const dados = await resposta.json();

  // Verifica se o cadastro funcionou.
  if (!resposta.ok) {
    throw new Error(dados.erro || 'Não foi possível cadastrar o usuário.');
  }

  // Devolve a confirmação do cadastro.
  return dados;
},

// Desativa um usuário, impedindo seu acesso ao sistema.
excluirUsuario: async (id) => {

  // Solicita a desativação do usuário ao backend.
  const resposta = await fetch(BASE_URL + '/api/usuarios/' + id, {
    method: 'DELETE',
    headers: cabecalhos()
  });

  // Lê a resposta enviada pelo servidor.
  const dados = await resposta.json();

  // Verifica se a desativação funcionou.
  if (!resposta.ok) {
    throw new Error(dados.erro || 'Não foi possível excluir o usuário.');
  }

  // Devolve a confirmação da desativação.
  return dados;
}};
})();
