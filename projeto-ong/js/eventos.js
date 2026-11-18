// Localiza a seção onde os eventos serão exibidos.
const listaEventos = document.getElementById('lista-eventos');

// Busca e exibe os eventos cadastrados.
async function carregarEventosPublicos() {
  try {
    // Consulta os eventos no backend.
    const eventos = await API.listarEventos();

    // Mostra apenas os eventos publicados e cancelados.
    const publicados = eventos.filter(
      evento => evento.status === 'Publicado' || evento.status === 'Cancelado'
    );

    // Limpa o conteúdo anterior.
    listaEventos.innerHTML = '';

    // Verifica se existem eventos publicados ou cancelados.
    if (publicados.length === 0) {
      listaEventos.textContent = 'Nenhum evento disponível no momento.';
      return;
    }

    // Cria um cartão para cada evento publicado.
    publicados.forEach(evento => {

      // Separa ano, mês e dia da data.
      const [ano, mes, dia] = evento.data.split('-');

      // Obtém o nome abreviado do mês.
      const nomeMes = new Date(
        Number(ano),
        Number(mes) - 1,
        Number(dia)
      ).toLocaleDateString('pt-BR', { month: 'short' });

      // Cria o cartão do evento.
      const artigo = document.createElement('article');
      artigo.className = 'evento';

      // Cria a área da data.
      const areaData = document.createElement('div');
      areaData.className = 'data';

      const numeroDia = document.createElement('b');
      numeroDia.textContent = dia;

      areaData.appendChild(numeroDia);
      areaData.appendChild(
        document.createTextNode(nomeMes.replace('.', ''))
      );

      // Cria a área das informações.
      const info = document.createElement('div');
      info.className = 'info';

      const titulo = document.createElement('h3');
      //Identifica visualmente os eventos cancelados.
      titulo.textContent = evento.status === 'Cancelado'? evento.titulo + ' (CANCELADO)': evento.titulo;

      const local = document.createElement('p');
      local.textContent = evento.local;

      const descricao = document.createElement('p');
      descricao.textContent = evento.descricao || '';

      const horario = document.createElement('p');
      horario.textContent = 'Horário: ' + evento.hora;

      // Organiza as informações.
      info.appendChild(titulo);
      info.appendChild(local);
      info.appendChild(descricao);
      info.appendChild(horario);

      // Monta o cartão completo.
      artigo.appendChild(areaData);
      artigo.appendChild(info);

      // Adiciona o cartão à página.
      listaEventos.appendChild(artigo);
    });

  } catch (erro) {
    console.error('Erro ao carregar eventos:', erro);
    listaEventos.textContent =
      'Não foi possível carregar os eventos no momento.';
  }
}

// Executa a função ao abrir a página.
carregarEventosPublicos();