// Busca os animais e atualiza a página inicial.
async function carregarPaginaInicial() {
  const lista = document.getElementById('lista-animais');

  try {
    // Busca os animais reais cadastrados no MySQL.
    const animais = await API.listarAnimais();

    // Separa os animais disponíveis para adoção.
    const disponiveis = animais.filter(
      animal => animal.status === 'Disponível'
    );

    // Separa os animais já adotados.
    const adotados = animais.filter(
      animal => animal.status === 'Adotado'
    );

    // Atualiza os indicadores da página inicial.
    document.getElementById('total-adotados').textContent =
      adotados.length;

    document.getElementById('total-disponiveis').textContent =
      disponiveis.length;

    document.getElementById('total-cadastrados').textContent =
      animais.length;

    // Limpa a mensagem de carregamento.
    lista.innerHTML = '';

    // Verifica se existem animais disponíveis.
    if (disponiveis.length === 0) {
      lista.textContent = 'Nenhum animal disponível no momento.';
      return;
    }

    // Mostra até quatro animais disponíveis na página inicial.
    disponiveis.slice(0, 4).forEach(animal => {

      // Cria o cartão do animal.
      const artigo = document.createElement('article');
      artigo.className = 'card';

      // Cria a imagem do animal.
      const imagem = document.createElement('img');
      imagem.src = animal.foto || '/img/sem-foto.png';
      imagem.alt = 'Foto de ' + animal.nome;

      // Cria o título com o nome do animal.
      const nome = document.createElement('h3');
      nome.textContent = animal.nome;

      // Cria a descrição.
      const descricao = document.createElement('p');
      descricao.textContent =
        [animal.especie, animal.raca, animal.porte]
          .filter(Boolean)
          .join(' · ');

      // Cria o link para a página de animais.
      const link = document.createElement('a');
      link.href = 'html/animais.html';
      link.className = 'btn';
      link.textContent = 'Conhecer animais';

      // Monta o cartão.
      artigo.appendChild(imagem);
      artigo.appendChild(nome);
      artigo.appendChild(descricao);
      artigo.appendChild(link);

      // Adiciona o cartão à página.
      lista.appendChild(artigo);
    });

  } catch (erro) {
    console.error('Erro ao carregar a página inicial:', erro);

    lista.textContent =
      'Não foi possível carregar os animais no momento.';
  }
}

// Localiza o formulário de inscrição de voluntários.
const formVoluntario = document.getElementById('form-voluntario');

// Localiza o espaço onde aparecerá a mensagem.
const mensagemVoluntario = document.getElementById('mensagem-voluntario');

// Escuta o envio do formulário.
formVoluntario.addEventListener('submit', async (evento) => {
  // Impede que a página recarregue ao enviar.
  evento.preventDefault();

  // Organiza os dados preenchidos pelo visitante.
  const dados = Object.fromEntries(
    //Impede que o navegador recarregue a página ao enviar o formulário
    new FormData(formVoluntario).entries()
  );

  // Informa que a inscrição está sendo enviada.
  mensagemVoluntario.textContent = 'Enviando inscrição...';

  try {
    // Envia os dados ao backend.
    const resposta = await fetch('/api/voluntarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });

    // Lê a resposta do servidor.
    const resultado = await resposta.json();

    // Verifica se o cadastro funcionou.
    if (!resposta.ok) {
      throw new Error(resultado.erro || 'Erro ao enviar inscrição.');
    }

    // Mostra a confirmação e limpa o formulário.
    mensagemVoluntario.textContent = resultado.mensagem;
    formVoluntario.reset();

  } catch (erro) {
    // Mostra uma mensagem caso ocorra algum problema.
    mensagemVoluntario.textContent = erro.message;
  }
});

// Inicia o carregamento da página.
carregarPaginaInicial();