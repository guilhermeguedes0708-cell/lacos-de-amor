/* ============================================================
   admin.js — Lógica das telas administrativas
   Depende de: api.js (carregado antes deste arquivo)

   Todas as telas chamam apenas funções de API.*, nunca dados
   fixos. Quando o back-end subir, nada aqui precisa mudar.
   ============================================================ */

/* ------------------------------------------------------------
   Utilitários
   ------------------------------------------------------------ */

// Impede a injeção de HTML ao exibir texto digitado pelo usuário
function esc(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Converte '2026-12-06' em '06/12/2026'
function dataBR(iso) {
  if (!iso) return '—';
  const [a, m, d] = String(iso).split('-');
  if (!a || !m || !d) return iso;
  return `${d}/${m}/${a}`;
}

// Exibe um aviso no topo da página
function avisar(mensagem, tipo = 'info') {
  const el = document.getElementById('aviso');
  if (!el) return;
  el.textContent = mensagem;
  el.className = 'aviso ' + tipo;
  el.hidden = false;
  clearTimeout(avisar._timer);
  avisar._timer = setTimeout(() => { el.hidden = true; }, 4000);
}

// O menu do topo agora é escrito direto no HTML de cada página,
// seguindo o mesmo padrão do site público da Pessoa 1.
// Aqui só ligamos o botão "Sair".
function ligarBotaoSair() {
  const sair = document.getElementById('btn-sair');
  if (sair) {
    sair.addEventListener('click', (ev) => {
      ev.preventDefault();
      API.logout();
      window.location.href = 'login.html';
    });
  }
}

/* ------------------------------------------------------------
   LOGIN
   ------------------------------------------------------------ */
function iniciarLogin() {
  const form = document.getElementById('form-login');
  if (!form) return;

  // Se já houver sessão, vai direto para o painel
  if (API.usuarioAtual()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const campoErro = document.getElementById('erro-login');

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const email = form.email.value.trim();
    const senha = form.senha.value;

    campoErro.textContent = '';

    if (!email) { campoErro.textContent = 'Informe o e-mail.'; return; }
    if (!senha) { campoErro.textContent = 'Informe a senha.'; return; }

    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    botao.textContent = 'Entrando…';

    try {
      await API.login(email, senha);
      window.location.href = 'dashboard.html';
    } catch (erro) {
      campoErro.textContent = erro.message || 'Não foi possível entrar.';
      botao.disabled = false;
      botao.textContent = 'Entrar';
    }
  });
}

/* ------------------------------------------------------------
   DASHBOARD
   ------------------------------------------------------------ */
// Busca os usuários cadastrados e preenche a tabela da dashboard.
async function carregarUsuarios() {

  // Localiza o corpo da tabela de usuários.
  const tabela = document.getElementById('tabela-usuarios');

  // Encerra a função se a tabela não existir nesta página.
  if (!tabela) return;

  // Recupera o usuário que está conectado.
  const usuarioLogado = API.usuarioAtual();

  try {
    // Busca os usuários cadastrados no banco de dados.
    const usuarios = await API.listarUsuarios();

    // Limpa a tabela antes de preenchê-la novamente.
    tabela.innerHTML = '';

    // Mostra uma mensagem caso não existam usuários.
    if (usuarios.length === 0) {
      const linha = tabela.insertRow();
      const celula = linha.insertCell();

      celula.colSpan = 5;
      celula.textContent = 'Nenhum usuário cadastrado.';
      return;
    }

    // Percorre os usuários recebidos do servidor.
    usuarios.forEach(usuario => {

      // Cria uma linha para cada usuário.
      const linha = tabela.insertRow();

      // Cria as células da linha.
      const celulaNome = linha.insertCell();
      const celulaEmail = linha.insertCell();
      const celulaTipo = linha.insertCell();
      const celulaStatus = linha.insertCell();
      const celulaAcoes = linha.insertCell();

      // Preenche as informações do usuário.
      celulaNome.textContent = usuario.nome;
      celulaEmail.textContent = usuario.email;

      celulaTipo.textContent = usuario.tipo === 'principal'
        ? 'Administrador principal'
        : 'Administrador comum';

      celulaStatus.textContent = Number(usuario.ativo) === 1
        ? 'Ativo'
        : 'Inativo';

      // Identifica se esta é a conta de quem está conectado.
      const propriaConta = Number(usuario.id_usuario) === Number(usuarioLogado?.id);

      // Usuários inativos não precisam de botão de exclusão.
      if (Number(usuario.ativo) !== 1) {
        celulaAcoes.textContent = 'Desativado';
        return;
      }

      // Impede a exclusão da própria conta.
      if (propriaConta) {
        celulaAcoes.textContent = 'Sua conta';
        return;
      }

      // Cria o botão de exclusão.
      const botaoExcluir = document.createElement('button');

      botaoExcluir.type = 'button';
      botaoExcluir.textContent = 'Excluir';
      botaoExcluir.className = 'btn';

      // Associa a exclusão ao usuário correto.
      botaoExcluir.addEventListener('click', async () => {

        // Pede confirmação antes de desativar o usuário.
        const confirmou = confirm(
          `Deseja realmente excluir o acesso de ${usuario.nome}?`
        );

        if (!confirmou) return;

        // Impede cliques repetidos enquanto a requisição acontece.
        botaoExcluir.disabled = true;

        try {
          await API.excluirUsuario(usuario.id_usuario);
          //solicita a exclusão
          avisar('Usuário excluído definitivamente!', 'sucesso');
          await carregarUsuarios();

        } catch (erro) {
          // Mostra a mensagem de erro retornada pelo servidor.
          avisar(erro.message, 'erro');

          // Permite tentar novamente.
          botaoExcluir.disabled = false;
        }
      });

      // Adiciona o botão à tabela.
      celulaAcoes.appendChild(botaoExcluir);
    });

  } catch (erro) {
    // Informa caso não seja possível carregar a lista.
    avisar('Erro ao carregar usuários: ' + erro.message, 'erro');
  }
}

// Prepara o formulário de cadastro de usuários.
function iniciarGerenciamentoUsuarios() {
  console.log('Iniciando gerenciamento de usuários!');

  // Localiza a seção e o formulário da dashboard.
  const secao = document.getElementById('secao-administradores');
  const formulario = document.getElementById('form-novo-admin');

  // Encerra a função quando não estamos na dashboard.
  if (!secao || !formulario) return;

  // Recupera os dados do administrador conectado.
  const usuarioLogado = API.usuarioAtual();

  // Apenas o administrador principal pode acessar esta seção.
  if (usuarioLogado?.tipo !== 'principal') return;

  // Exibe a seção de gerenciamento.
  secao.hidden = false;

  // Carrega a tabela de usuários.
  carregarUsuarios();

  // Identifica o envio do formulário.
  formulario.addEventListener('submit', async (evento) => {

    // Impede o navegador de recarregar a página.
    evento.preventDefault();

    // Recupera os valores preenchidos no formulário.
    const nome = document.getElementById('admin-nome').value.trim();
    const email = document.getElementById('admin-email').value.trim();
    const senha = document.getElementById('admin-senha').value;
    const tipo = document.getElementById('admin-tipo').value;


    // Verifica se todos os campos foram preenchidos.
    if (!nome || !email || !senha || !tipo) {
      avisar('Preencha todos os campos do usuário.', 'erro');
      return;
    }

    // Verifica o tamanho mínimo da senha.
    if (senha.length < 8) {
      avisar('A senha deve ter pelo menos 8 caracteres.', 'erro');
      return;
    }

    // Localiza o botão de cadastro.
    const botaoCadastrar = formulario.querySelector('button[type="submit"]');

    // Impede envios repetidos.
    botaoCadastrar.disabled = true;

    try {
      console.log('Vou chamar a API de cadastro!');
      console.log('Função cadastrarUsuario:', typeof API.cadastrarUsuario);
      // Envia os dados para o backend.
      await API.cadastrarUsuario({nome,email,senha,tipo});

      // Mostra a confirmação do cadastro.
      avisar('Usuário cadastrado com sucesso!', 'sucesso');

      // Limpa os campos do formulário.
      formulario.reset();

      // Atualiza a tabela para mostrar o novo usuário.
      await carregarUsuarios();

    } catch (erro) {
      // Exibe a mensagem retornada pelo servidor.
      avisar(erro.message, 'erro');

    } finally {
      // Libera novamente o botão.
      botaoCadastrar.disabled = false;
    }
  });
}

async function iniciarDashboard() {
  if (!document.getElementById('indicadores')) return;
  if (!API.exigirLogin()) return;

  ligarBotaoSair();
  // Mostra o cadastro de administradores apenas para o principal.
  const secaoAdministradores = document.getElementById('secao-administradores');
  //Encontra o formulário de cadastro de administradores
  const usuarioLogado = API.usuarioAtual();
  //Recupera as informações do usuário que está conectado

  if (secaoAdministradores && usuarioLogado?.tipo === 'principal') {
    //Somente o principal terá o formulário exibido
    secaoAdministradores.hidden = false;
    //Faz o formulário aparecer na dashboard
  }

  try {
    const [s, animais, voluntarios] = await Promise.all([
      API.estatisticas(),
      API.listarAnimais(),
      API.listarVoluntarios()
    ]);

    document.getElementById('indicadores').innerHTML = `
      <div class="indicador"><b>${s.animais_disponiveis}</b><span>animais disponíveis</span></div>
      <div class="indicador"><b>${s.animais_adotados}</b><span>animais adotados</span></div>
      <div class="indicador"><b>${s.eventos_publicados}</b><span>eventos publicados</span></div>
      <div class="indicador"><b>${voluntarios.filter(v => v.status === 'Pendente').length}</b><span>inscrições pendentes de voluntários</span></div>`;

    //Seleciona os quatro animais mais recentes
    const ultimos = animais.slice(0, 4);
    document.getElementById('ultimos-animais').innerHTML = ultimos.length
      ? ultimos.map(a => `
          <tr>
            <td>${esc(a.nome)}</td>
            <td>${esc(a.especie)}</td>
            <td>${esc(a.porte)}</td>
            <td><span class="etiqueta ${a.status === 'Adotado' ? 'adotado' : 'disponivel'}">${esc(a.status)}</span></td>
          </tr>`).join('')
      : '<tr><td colspan="4" class="vazio">Nenhum animal cadastrado ainda.</td></tr>';

    // Inscrições novas de voluntários
    // Inscrições pendentes de voluntários
    const pendentes = voluntarios.filter(v => v.status === 'Pendente');
    document.getElementById('voluntarios-novos').innerHTML = pendentes.length? pendentes.map(v => `
      <tr>
        <td>${esc(v.nome)}</td>
        <td>${esc(v.email)}</td>
        <td>—</td>
      </tr>`).join(''): '<tr><td colspan="3" class="vazio">Nenhuma inscrição pendente.</td></tr>';

  } catch (erro) {
    avisar('Erro ao carregar o painel: ' + erro.message, 'erro');
  }
}

/* ------------------------------------------------------------
   ANIMAIS — listar, cadastrar, editar, excluir
   ------------------------------------------------------------ */
let animaisCache = [];

//Converte os valores de anos e meses em uma idade legível na tabela
function formatarIdade(anos, meses) {
  anos = Number(anos) || 0;
  meses = Number(meses) || 0;

  const partes = [];

  if (anos > 0) {
    partes.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
  }

  if (meses > 0) {
    partes.push(`${meses} ${meses === 1 ? 'mês' : 'meses'}`);
  }

  return partes.length ? partes.join(' e ') : 'Menos de 1 mês';
}

async function iniciarAnimais() {
  const corpo = document.getElementById('corpo-animais');
  if (!corpo) return;
  if (!API.exigirLogin()) return;

  ligarBotaoSair();

  const modal = document.getElementById('modal-animal');
  const form = document.getElementById('form-animal');
  const tituloModal = document.getElementById('titulo-modal-animal');

  // --- Carregar e desenhar a lista ---
  async function carregar() {
    try {
      animaisCache = await API.listarAnimais();
      desenhar();
    } catch (erro) {
      avisar('Erro ao carregar animais: ' + erro.message, 'erro');
    }
  }

  function desenhar() {
    const busca = document.getElementById('filtro-busca').value.trim().toLowerCase();
    const status = document.getElementById('filtro-status').value;
    const especie = document.getElementById('filtro-especie').value;

    const lista = animaisCache.filter(a => {
      const combinaBusca = !busca ||
        [a.nome, a.raca, a.descricao].some(c => String(c || '').toLowerCase().includes(busca));
      const combinaStatus = !status || a.status === status;
      const combinaEspecie = !especie || a.especie === especie;
      return combinaBusca && combinaStatus && combinaEspecie;
    });

    corpo.innerHTML = lista.length
      ? lista.map(a => `
          <tr>
            <td><strong>${esc(a.nome)}</strong></td>
            <td>${esc(a.especie)}</td>
            <td>${esc(a.raca)}</td>
            <td>${esc(formatarIdade(a.idade, a.meses))}</td>
            <td>${esc(a.porte)}</td>
            <td>${esc(a.sexo)}</td>
            <td><span class="etiqueta ${a.status === 'Adotado' ? 'adotado' : 'disponivel'}">${esc(a.status)}</span></td>
            <td>
              <div class="acoes-tabela">
                <button type="button" class="btn ghost pequeno" data-editar="${a.id}">Editar</button>
                <button type="button" class="btn perigo pequeno" data-excluir="${a.id}">Excluir</button>
              </div>
            </td>
          </tr>`).join('')
      : `<tr><td colspan="8" class="vazio"><span class="icone">🐾</span>Nenhum animal encontrado.</td></tr>`;

    document.getElementById('contagem-animais').textContent =
      lista.length === animaisCache.length
        ? `${lista.length} animal(is) cadastrado(s)`
        : `${lista.length} de ${animaisCache.length} animal(is)`;
  }

  // --- Abrir o formulário (novo ou edição) ---
  function abrirModal(animal) {
    form.reset();
    document.querySelectorAll('.erro-campo').forEach(e => e.textContent = '');

    if (animal) {
      tituloModal.textContent = 'Editar animal';
      form.elements.namedItem('id').value = animal.id;//Coloca o ID do animal selecionado no campo oculto do formulário
      form.nome.value = animal.nome;
      form.especie.value = animal.especie;
      form.raca.value = animal.raca || '';
      form.idade.value = animal.idade;
      form.meses.value = animal.meses ?? 0;
      form.porte.value = animal.porte;
      form.sexo.value = animal.sexo;
      form.status.value = animal.status;
      form.descricao.value = animal.descricao || '';
    } else {
      tituloModal.textContent = 'Cadastrar novo animal';
      form.elements.namedItem('id').value = ''; //Limpa o ID quando o administrador abre o formulário para cadastrar um animal novo
      form.meses.value = 0; //Quando o administrador abrir o formulário para cadastrar um animal novo, o campo Meses começará em zero
    }

    modal.hidden = false;
    form.nome.focus();
  }

  function fecharModal() { modal.hidden = true; }

  // --- Validação ---
  function validar() {
    let ok = true;

    function exigir(nomeCampo, mensagem) {
      const campo = form[nomeCampo];
      const erro = campo.parentElement.querySelector('.erro-campo');
      if (!String(campo.value).trim()) {
        if (erro) erro.textContent = mensagem;
        ok = false;
      } else if (erro) {
        erro.textContent = '';
      }
    }

    exigir('nome', 'Informe o nome.');
    exigir('especie', 'Selecione a espécie.');
    exigir('porte', 'Selecione o porte.');
    exigir('sexo', 'Selecione o sexo.');
    exigir('status', 'Selecione o status.');

    // Idade: precisa ser um número não negativo
    const erroIdade = form.idade.parentElement.querySelector('.erro-campo');
    if (form.idade.value === '' || Number(form.idade.value) < 0) {
      erroIdade.textContent = 'Informe uma idade válida.';
      ok = false;
    } else {
      erroIdade.textContent = '';
    }

    const erroMeses = form.meses.parentElement.querySelector('.erro-campo');
    if (form.meses.value === '' ||!Number.isInteger(Number(form.meses.value)) || Number(form.meses.value) < 0 ||Number(form.meses.value) > 11) {
      erroMeses.textContent = 'Informe os meses entre 0 e 11.';
      ok = false;
    } 
    else {
      erroMeses.textContent = '';
    }

    return ok;
  }

  // --- Eventos ---
  document.getElementById('btn-novo-animal').addEventListener('click', () => abrirModal(null));
  document.getElementById('btn-cancelar-animal').addEventListener('click', fecharModal);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) fecharModal(); });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!validar()) return;

    const animal = {
      id: form.elements.namedItem('id').value? Number(form.elements.namedItem('id').value): undefined,
      nome: form.nome.value.trim(),
      especie: form.especie.value,
      raca: form.raca.value.trim(),
      idade: Number(form.idade.value),
      meses: Number(form.meses.value),
      porte: form.porte.value,
      sexo: form.sexo.value,
      status: form.status.value,
      descricao: form.descricao.value.trim()
    };
    const arquivoFoto = form.elements.namedItem('foto').files[0];
    //Procura o arquivo de imagem

    try {
      await API.salvarAnimal(animal, arquivoFoto);
      //Envia os dados do animal e a foto selecionada para a função responsável pelo cadastro
      fecharModal();
      await carregar();
      avisar(animal.id ? 'Animal atualizado com sucesso.' : 'Animal cadastrado com sucesso.', 'sucesso');
    } catch (erro) {
      avisar('Erro ao salvar: ' + erro.message, 'erro');
    }
  });

  corpo.addEventListener('click', async (ev) => {
    const idEditar = ev.target.getAttribute('data-editar');
    const idExcluir = ev.target.getAttribute('data-excluir');

    if (idEditar) {
      const animal = animaisCache.find(a => a.id === Number(idEditar));
      if (animal) abrirModal(animal);
    }

    if (idExcluir) {
      const animal = animaisCache.find(a => a.id === Number(idExcluir));
      if (!animal) return;
      if (!confirm(`Excluir "${animal.nome}"? Esta ação não pode ser desfeita.`)) return;

      try {
        await API.excluirAnimal(Number(idExcluir));
        await carregar();
        avisar('Animal excluído.', 'sucesso');
      } catch (erro) {
        avisar('Erro ao excluir: ' + erro.message, 'erro');
      }
    }
  });

  // Filtros
  ['filtro-busca', 'filtro-status', 'filtro-especie'].forEach(id => {
    document.getElementById(id).addEventListener('input', desenhar);
    document.getElementById(id).addEventListener('change', desenhar);
  });

  await carregar();
}

/* ------------------------------------------------------------
   EVENTOS — listar, cadastrar, editar, excluir
   ------------------------------------------------------------ */
let eventosCache = [];

async function iniciarEventos() {
  const corpo = document.getElementById('corpo-eventos');
  if (!corpo) return;
  if (!API.exigirLogin()) return;

  ligarBotaoSair();

  const modal = document.getElementById('modal-evento');
  const form = document.getElementById('form-evento');
  const tituloModal = document.getElementById('titulo-modal-evento');

  async function carregar() {
    try {
      eventosCache = await API.listarEventos();
      desenhar();
    } catch (erro) {
      avisar('Erro ao carregar eventos: ' + erro.message, 'erro');
    }
  }

  function desenhar() {
    const busca = document.getElementById('filtro-busca').value.trim().toLowerCase();
    const status = document.getElementById('filtro-status').value;

    const lista = eventosCache.filter(e => {
      const combinaBusca = !busca ||
        [e.titulo, e.local, e.descricao].some(c => String(c || '').toLowerCase().includes(busca));
      const combinaStatus = !status || e.status === status;
      return combinaBusca && combinaStatus;
    });

    corpo.innerHTML = lista.length
      ? lista.map(e => `
          <tr>
            <td><strong>${esc(e.titulo)}</strong></td>
            <td>${dataBR(e.data)}</td>
            <td>${esc(e.hora || '—')}</td>
            <td>${esc(e.local)}</td>
            <td><span class="etiqueta ${e.status === 'Publicado' ? 'publicado' : e.status === 'Cancelado' ? 'cancelado' : 'rascunho'}">${esc(e.status)}</span></td>
            <td>
              <div class="acoes-tabela">
                <button type="button" class="btn ghost pequeno" data-editar="${e.id}">Editar</button>
                <button type="button" class="btn perigo pequeno" data-excluir="${e.id}">Excluir</button>
              </div>
            </td>
          </tr>`).join('')
      : `<tr><td colspan="6" class="vazio"><span class="icone">📅</span>Nenhum evento encontrado.</td></tr>`;

    document.getElementById('contagem-eventos').textContent =
      lista.length === eventosCache.length
        ? `${lista.length} evento(s) cadastrado(s)`
        : `${lista.length} de ${eventosCache.length} evento(s)`;
  }

  function abrirModal(evento) {
    form.reset();
    document.querySelectorAll('.erro-campo').forEach(e => e.textContent = '');

    if (evento) {
      tituloModal.textContent = 'Editar evento';
      form.elements.namedItem('id').value = evento.id;
      form.titulo.value = evento.titulo;
      form.descricao.value = evento.descricao || '';
      form.data.value = evento.data || '';
      form.hora.value = evento.hora || '';
      form.local.value = evento.local || '';
      form.status.value = evento.status;
    } else {
      tituloModal.textContent = 'Cadastrar novo evento';
      form.elements.namedItem('id').value = '';
    }

    modal.hidden = false;
    form.titulo.focus();
  }

  function fecharModal() { modal.hidden = true; }

  function validar() {
    let ok = true;

    function exigir(nomeCampo, mensagem) {
      const campo = form[nomeCampo];
      const erro = campo.parentElement.querySelector('.erro-campo');
      if (!String(campo.value).trim()) {
        if (erro) erro.textContent = mensagem;
        ok = false;
      } else if (erro) {
        erro.textContent = '';
      }
    }

    exigir('titulo', 'Informe o título.');
    exigir('data', 'Informe a data.');
    exigir('local', 'Informe o local.');
    exigir('status', 'Selecione o status.');

    return ok;
  }

  document.getElementById('btn-novo-evento').addEventListener('click', () => abrirModal(null));
  document.getElementById('btn-cancelar-evento').addEventListener('click', fecharModal);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) fecharModal(); });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!validar()) return;

    const evento = {
      id: form.id.value ? Number(form.id.value) : undefined,
      titulo: form.titulo.value.trim(),
      descricao: form.descricao.value.trim(),
      data: form.data.value,
      hora: form.hora.value,
      local: form.local.value.trim(),
      status: form.status.value
    };

    try {
      await API.salvarEvento(evento);
      fecharModal();
      await carregar();
      avisar(evento.id ? 'Evento atualizado com sucesso.' : 'Evento cadastrado com sucesso.', 'sucesso');
    } catch (erro) {
      avisar('Erro ao salvar: ' + erro.message, 'erro');
    }
  });

  corpo.addEventListener('click', async (ev) => {
    const idEditar = ev.target.getAttribute('data-editar');
    const idExcluir = ev.target.getAttribute('data-excluir');

    if (idEditar) {
      const evento = eventosCache.find(e => e.id === Number(idEditar));
      if (evento) abrirModal(evento);
    }

    if (idExcluir) {
      const evento = eventosCache.find(e => e.id === Number(idExcluir));
      if (!evento) return;
      if (!confirm(`Excluir o evento "${evento.titulo}"?`)) return;

      try {
        await API.excluirEvento(Number(idExcluir));
        await carregar();
        avisar('Evento excluído.', 'sucesso');
      } catch (erro) {
        avisar('Erro ao excluir: ' + erro.message, 'erro');
      }
    }
  });

  ['filtro-busca', 'filtro-status'].forEach(id => {
    document.getElementById(id).addEventListener('input', desenhar);
    document.getElementById(id).addEventListener('change', desenhar);
  });

  await carregar();
}

/* ------------------------------------------------------------
   VOLUNTÁRIOS — consultar inscrições
   ------------------------------------------------------------ */
let voluntariosCache = [];

async function iniciarVoluntarios() {
  const corpo = document.getElementById('corpo-voluntarios');
  if (!corpo) return;
  if (!API.exigirLogin()) return;

  ligarBotaoSair();

  const modal = document.getElementById('modal-voluntario');
  const detalhe = document.getElementById('detalhe-voluntario');

  async function carregar() {
    try {
      voluntariosCache = await API.listarVoluntarios();
      desenhar();
    } catch (erro) {
      avisar('Erro ao carregar inscrições: ' + erro.message, 'erro');
    }
  }

  function desenhar() {
    const busca = document.getElementById('filtro-busca').value.trim().toLowerCase();
    const status = document.getElementById('filtro-status').value;

    const lista = voluntariosCache.filter(v => {
      const combinaBusca = !busca ||
        [v.nome, v.email, v.telefone, v.area_interesse, v.motivacao].some(c => String(c || '').toLowerCase().includes(busca));
      const combinaStatus = !status || v.status === status;
      return combinaBusca && combinaStatus;
    });

    // Mais recentes primeiro
    lista.sort((a, b) => b.id - a.id);

    corpo.innerHTML = lista.length
      ? lista.map(v => `
          <tr>
          <td><strong>${esc(v.nome)}</strong></td>
          <td>${esc(v.email)}</td>
          <td>${esc(v.telefone)}</td>
          <td>—</td>
          <td><span class="etiqueta nova">${esc(v.status)}</span></td>
          <td>
          <div class="acoes-tabela">
          <button type="button" class="btn ghost pequeno" data-ver="${v.id}">Ver</button>
          <button type="button" class="btn perigo pequeno" data-excluir="${v.id}">Excluir</button>
          </div>
          </td>
          </tr>`).join(''): `<tr><td colspan="6" class="vazio"><span class="icone">🙋</span>Nenhuma inscrição encontrada.</td></tr>`;

    const pendentes = voluntariosCache.filter(v => v.status === 'Pendente').length;
    document.getElementById('contagem-voluntarios').textContent =`${voluntariosCache.length} inscrição(ões) · ${pendentes} pendente(s)`;
  }

  function abrirDetalhe(v) {
  detalhe.innerHTML = `
    <div class="form-grid">
      <div class="campo"><label>Nome</label><div>${esc(v.nome)}</div></div>
      <div class="campo"><label>E-mail</label><div>${esc(v.email)}</div></div>
      <div class="campo"><label>Telefone</label><div>${esc(v.telefone)}</div></div>
      <div class="campo largo"><label>Área de interesse</label><div>${esc(v.area_interesse)}</div></div>
      <div class="campo largo"><label>Disponibilidade</label><div>${esc(v.disponibilidade)}</div></div>
      <div class="campo largo"><label>Motivação</label><div>${esc(v.motivacao) || '—'}</div></div>
      <div class="campo"><label>Status</label><div>${esc(v.status)}</div></div>
    </div>`;

  modal.hidden = false;
}

  document.getElementById('btn-fechar-voluntario').addEventListener('click', () => { modal.hidden = true; });
  modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.hidden = true; });

  corpo.addEventListener('click', async (ev) => {
    const idVer = ev.target.getAttribute('data-ver');
    const idExcluir = ev.target.getAttribute('data-excluir');

    if (idVer) {
      const v = voluntariosCache.find(x => x.id === Number(idVer));
      if (v) abrirDetalhe(v);
    }
    if (idExcluir) {                                                                                   
      const voluntario = voluntariosCache.find(v => v.id === Number(idExcluir));
      if (!voluntario) return;
      if (!confirm(`Excluir a inscrição de "${voluntario.nome}"? Esta ação não pode ser desfeita.`)) {
        return;
      }
      try {
        await API.excluirVoluntario(Number(idExcluir));
        await carregar();
        avisar('Inscrição excluída com sucesso!', 'sucesso');
      } catch (erro) {
        avisar('Erro ao excluir: ' + erro.message, 'erro');
      }
    }
  });

  ['filtro-busca', 'filtro-status'].forEach(id => {
    document.getElementById(id).addEventListener('input', desenhar);
    document.getElementById(id).addEventListener('change', desenhar);
  });

  await carregar();
}

/* ------------------------------------------------------------
   Inicialização — cada página chama só o que precisa
   ------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  iniciarLogin();
  iniciarDashboard();
  iniciarGerenciamentoUsuarios();
  iniciarAnimais();
  iniciarEventos();
  iniciarVoluntarios();
});
