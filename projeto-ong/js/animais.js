function formatarIdade(anos, meses) {
  //recebe os anos e os meses do animal
  anos = Number(anos) || 0;
  //garantem que os valores sejam números
  meses = Number(meses) || 0;

  const partes = [];

  if (anos > 0) {
    partes.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
    //adiciona os anos ou meses ao texto
  }

  if (meses > 0) {
    partes.push(`${meses} ${meses === 1 ? 'mês' : 'meses'}`);
    //adiciona os anos ou meses ao texto
  }

  return partes.length ? partes.join(' e ') : 'Menos de 1 mês';
}
// Busca os animais cadastrados no MySQL e mostra na página pública.
async function carregarAnimaisPublicos() {
  const lista = document.getElementById('lista-animais');

  try {
    // Consulta os animais pela API.
    const animais = await API.listarAnimais();

    // Mostra apenas os animais disponíveis para adoção.
    const disponiveis = animais.filter(
      animal => animal.status === 'Disponível'
    );

    // Limpa a mensagem de carregamento.
    lista.replaceChildren();

    // Verifica se existem animais disponíveis.
    if (disponiveis.length === 0) {
      const mensagem = document.createElement('p');
      mensagem.textContent = 'Nenhum animal disponível no momento.';
      lista.appendChild(mensagem);
      return;
    }

    // Cria um card para cada animal.
    disponiveis.forEach(animal => {
      const card = document.createElement('div');
      card.className = 'card';

      // Área da foto.
      const areaFoto = document.createElement('div');
      areaFoto.className = 'pic';

      if (animal.foto) {
        const imagem = document.createElement('img');
        imagem.src = animal.foto.startsWith('/uploads/')? 'https://lacos-de-amor-production.up.railway.app' + animal.foto: animal.foto;
        imagem.alt = 'Foto de ' + animal.nome;
        imagem.loading = 'lazy';areaFoto.appendChild(imagem);
      } 
      else {
        areaFoto.textContent = '🐾';
      }

      // Área das informações.
      const corpo = document.createElement('div');
      corpo.className = 'body';

      const nome = document.createElement('h3');
      nome.textContent = animal.nome;

      corpo.appendChild(nome);

      // Espécie, idade e porte.
      const informacoes = [
        animal.especie,
        animal.idade != null ? formatarIdade(animal.idade, animal.meses) : null,
        animal.porte
      ];

      informacoes.filter(Boolean).forEach(valor => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = valor;
        corpo.appendChild(tag);
      });

      // Raça, quando informada.
      if (animal.raca) {
        const raca = document.createElement('p');
        raca.textContent = 'Raça: ' + animal.raca;
        corpo.appendChild(raca);
      }

      // Descrição.
      if (animal.descricao) {
        const descricao = document.createElement('p');
        descricao.textContent = animal.descricao;
        corpo.appendChild(descricao);
      }

      // Botão de adoção.
      const botao = document.createElement('a');
      botao.className = 'btn';
      botao.href = 'login.html';
      botao.textContent = 'Quero adotar';

      corpo.appendChild(botao);
      card.appendChild(areaFoto);
      card.appendChild(corpo);
      lista.appendChild(card);
    });

  } catch (erro) {
    console.error('Erro ao carregar animais:', erro);
    lista.textContent = 'Não foi possível carregar os animais. Tente novamente.';
  }
}

// Executa a busca quando a página é carregada.
carregarAnimaisPublicos();