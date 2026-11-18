
require('dotenv').config();
// Lê as configurações do .env

const express = require('express');
// Importa as bibliotecas que já foram baixadas.
// Eu usei npm install express mysql2 dotenv para instalar as bibliotecas.
// Express cria o servidor.
// mysql2 permite que o Node.js se comunique com o MySQL.
// dotenv lê as configurações do .env.
// const express guarda a biblioteca que controla o servidor.
//o POST cria um registro novo, enquanto o PUT altera um registro existente

const cors = require('cors');

const mysql = require('mysql2/promise');
// Permite consultar o banco usando async e await.

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const path = require('path');
//Importa uma biblioteca para localizar corretamente as pastas e os arquivos do site.

const multer = require('multer');
//Importa o Multer para receber arquivos enviados pelo formulário
const fs = require('fs');
//Importa o módulo nativo do Node.js que permite trabalhar com pastas e arquivos
const crypto = require('crypto');
//Importa o módulo nativo que usamos para gerar nomes únicos para as fotos

const app = express();
// Cria o servidor Express.

app.use(cors({
  origin: 'https://lacos-de-amor.netlify.app'
}));

// Pasta onde as fotos dos animais serão armazenadas.
const pastaUploads = path.join(__dirname, 'uploads');

// Cria a pasta caso ela ainda não exista.
fs.mkdirSync(pastaUploads, { recursive: true });

// Configura onde e com qual nome as fotos serão salvas.
const armazenamento = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaUploads);
  },

  filename: (req, file, cb) => {
    const extensoes = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp'
    };

    const extensao = extensoes[file.mimetype];
    const nomeUnico = crypto.randomUUID() + extensao;

    cb(null, nomeUnico);
  }
});

// Configura o recebimento das imagens.
const uploadFoto = multer({
  storage: armazenamento,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const formatosPermitidos = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!formatosPermitidos.includes(file.mimetype)) {
      return cb(new Error('Envie uma imagem JPG, PNG ou WebP.'));
    }

    cb(null, true);
  }
});

app.use(express.json());
// O servidor interpreta dados JSON enviados pelo api.js.

app.use('/css', express.static(path.join(__dirname, 'projeto-ong', 'css')));
//Permite que o navegador acesse os arquivos da pasta css pelo endereço /css
//__dirname é onde tá a pasta do servidor
app.use('/js', express.static(path.join(__dirname, 'projeto-ong', 'js')));
app.use('/img', express.static(path.join(__dirname, 'projeto-ong', 'img')));
app.use('/uploads', express.static(pastaUploads));
app.use('/html', express.static(path.join(__dirname, 'projeto-ong', 'html')));

const PORT = process.env.PORT || 3001;
// Define a porta do servidor.

const banco = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true, // Aguarda uma conexão ficar disponível quando todas estiverem ocupadas.
  connectionLimit: 10 // Permite até 10 conexões simultâneas no pool.
});
// As configurações do banco são lidas do arquivo .env.

async function autenticarAdmin(req, res, next) {
  // Lê o cabeçalho Authorization enviado pelo navegador.
  const autorizacao = req.headers.authorization;

  // Verifica se existe um token no formato Bearer.
  if (!autorizacao || !autorizacao.startsWith('Bearer ')) {
    return res.status(401).json({
      erro: 'Acesso não autorizado. Faça login.'
    });
  }

  // Extrai somente o token.
  const token = autorizacao.slice(7);

  try {
    // Confirma se o token foi assinado pelo nosso servidor.
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    // Verifica se o usuário ainda existe e está ativo no banco.
    const [usuarios] = await banco.query('SELECT id_usuario FROM usuario WHERE id_usuario = ? AND ativo = 1 LIMIT 1',[dados.id]);
    // Bloqueia o acesso caso a conta tenha sido desativada.
    if (usuarios.length === 0) {return res.status(403).json({erro: 'Sua conta foi desativada. Entre em contato com o administrador principal.'});}
    // Guarda o identificador do administrador autenticado.
    req.usuario = dados;
    // Permite continuar para a rota solicitada.
    next();
  }
  catch (erro) {
    // Identifica erros relacionados ao token.
    if (erro.name === 'JsonWebTokenError' || erro.name === 'TokenExpiredError') {
      return res.status(401).json({
      erro: 'Sessão inválida ou expirada. Faça login novamente.'
    });
  }
  // Registra erros inesperados, como falhas na consulta ao banco.
  console.error('Erro ao autenticar administrador:', erro);
  return res.status(500).json({erro: 'Não foi possível verificar o acesso do usuário.'});
}}

async function exigirAdminPrincipal(req, res, next) {
  // Busca no banco o tipo do usuário que está autenticado.
  try {
    const [usuarios] = await banco.query(
      'SELECT tipo FROM usuario WHERE id_usuario = ? AND ativo = 1 LIMIT 1',
      [req.usuario.id]
    );

    // Verifica se o usuário existe e é o administrador principal.
    if (usuarios.length === 0 || usuarios[0].tipo !== 'principal') {
      return res.status(403).json({
        erro: 'Apenas o administrador principal pode realizar esta ação.'
      });
    }

    // Permite continuar quando o usuário é o administrador principal.
    next();

  } catch (erro) {
    console.error('Erro ao verificar permissão:', erro);

    return res.status(500).json({
      erro: 'Não foi possível verificar a permissão do usuário.'
    });
  }
}

// Testar se o servidor está funcionando.

app.get('/api/status', (req, res) => {
  res.json({
    mensagem: 'Backend do Laços de Amor funcionando!'
  });
});


//Testar a conexão com o MySQL.

app.get('/api/teste-banco', async (req, res) => {
  // Cria a rota /api/teste-banco.

  console.log('1 - A rota foi acessada');
  // Confirma no terminal que o Express recebeu a requisição.

  try {
    // Tudo será executado normalmente, mas, se houver um erro,
    // ele será enviado para o catch.

    const [resultado] = await banco.query(
      'SELECT DATABASE() AS banco_atual'
    );
    // Consulta o MySQL e retorna o nome do banco de dados.
    // O await espera a consulta terminar.
    // [resultado] guarda a primeira parte da resposta do mysql2.

    console.log('2 - O MySQL respondeu');
    // Confirma no terminal que a consulta terminou.

    res.json({
      // Envia a resposta ao navegador.

      mensagem: 'Conexão com MySQL funcionando!',
      banco: resultado[0].banco_atual
      // Acessa a primeira linha retornada pelo MySQL
      // e pega o nome do banco.
    });

  } catch (erro) {
    // Se o try der erro, ele vem para cá.

    console.error('Erro ao conectar ao MySQL:', erro);
    // Mostra o erro no terminal.

    res.status(500).json({
      // Define o código de status HTTP da resposta.
      // O 500 significa que ocorreu um erro interno no servidor.

      erro: 'Não foi possível conectar ao banco de dados.'
    });
  }
});


//Buscar os animais cadastrados.

app.get('/api/animais', async (req, res) => {
  // Cria a rota /api/animais.

  try {
    // Tudo será executado normalmente, mas, se houver um erro,
    // ele será enviado para o catch.

    const [animais] = await banco.query(`
      SELECT
        id_animal AS id,
        nome,
        especie,
        raca,
        idade,
        meses,
        porte,
        sexo,
        status_adocao AS status,
        descricao,
        foto
      FROM animais
      ORDER BY id_animal DESC
    `);
    // Consulta o MySQL e guarda os registros no array animais.
    // O await espera a consulta terminar.
    // O AS dá um apelido para algumas colunas.
    // O ORDER BY organiza os animais pelo ID, do maior para o menor.

    res.json(animais);
    // Envia ao navegador a lista de animais encontrados.

  } catch (erro) {
    // Realiza este bloco se houver um erro no try.

    console.error('Erro ao buscar animais:', erro);
    // Mostra o erro no terminal.

    res.status(500).json({
      // Informa ao navegador que houve uma falha ao buscar os animais.

      erro: 'Não foi possível buscar os animais.'
    });
  }
});

//Cadastrar um animal no banco de dados.
app.post('/api/animais', autenticarAdmin, uploadFoto.single('foto'), async (req, res) => {

  // Recebe os dados enviados pelo formulário.
  const {
  nome,
  especie,
  raca,
  idade,
  meses,
  porte,
  sexo,
  status,
  descricao} = req.body;

// Obtém o caminho da foto enviada.
const foto = req.file ? '/uploads/' + req.file.filename : null;
const removerFotoEnviada = () => {
  if (req.file) {
    fs.unlink(req.file.path, (erroArquivo) => {
      if (erroArquivo) {
        console.error('Erro ao remover foto:', erroArquivo);
      }
    });
  }
};

  // Verifica os campos obrigatórios.
  if (!nome || !especie) {
    removerFotoEnviada();
    return res.status(400).json({
      erro: 'Informe o nome e a espécie do animal.'
    });
  }

  console.log('Meses recebidos:', meses);
  console.log('Tipo dos meses:', typeof meses);

  // Valida a idade, quando informada.
  if (idade != null && idade !== '' && (!Number.isInteger(Number(idade)) || Number(idade) < 0)) {
        removerFotoEnviada();
        return res.status(400).json({
          erro: 'A idade deve ser um número inteiro maior ou igual a zero.'
        });
      }
    // Verifica se os meses estão entre 0 e 11.
  if (!Number.isInteger(Number(meses)) || Number(meses) < 0 || Number(meses) > 11) {
    removerFotoEnviada();
    return res.status(400).json({
      erro: 'Os meses devem ser um número inteiro entre 0 e 11.'
    });
  }    

  try {
    // Salva o animal no MySQL.
    const [resultado] = await banco.query(
      `INSERT INTO animais
       (nome, especie, raca, idade, meses, porte, sexo,
        status_adocao, descricao, foto, id_usuario)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        especie,
        raca || null,
        idade === '' || idade == null ? null : Number(idade),
        Number(meses),
        porte || null,
        sexo || null,
        status || 'Disponível',
        descricao || null,
        foto || null,
        req.usuario.id
      ]
    );

    // Confirma o cadastro.
    return res.status(201).json({
      //retorna que um novo registro foi criado
      mensagem: 'Animal cadastrado com sucesso!',
      id: resultado.insertId
    });

  } catch (erro) {
    console.error('Erro ao cadastrar animal:', erro);

    if (req.file) {
      fs.unlink(req.file.path, (erroArquivo) => {
        if (erroArquivo) console.error('Erro ao remover foto:', erroArquivo);
      });
    }
    //Remove a foto enviada caso o cadastro falhe no banco de dados

    return res.status(500).json({
      erro: 'Não foi possível cadastrar o animal.'
    });
  }
});

// Atualizar os dados de um animal já cadastrado.
app.put('/api/animais/:id', autenticarAdmin, uploadFoto.single('foto'), async (req, res) => {

  // Identifica qual animal será editado.
  const id = Number(req.params.id);

  // Recebe os novos dados do formulário.
  const {
    nome,
    especie,
    raca,
    idade,
    meses,
    porte,
    sexo,
    status,
    descricao
  } = req.body;

  // Remove a foto recém-enviada caso a edição não possa ser concluída.
  const removerFotoEnviada = () => {
    if (req.file) {
      fs.unlink(req.file.path, (erroArquivo) => {
        if (erroArquivo) {
          console.error('Erro ao remover foto:', erroArquivo);
        }
      });
    }
  };

  // Verifica se o ID é válido.
  if (!Number.isInteger(id) || id <= 0) {
    removerFotoEnviada();
    return res.status(400).json({ erro: 'ID do animal inválido.' });
  }

  // Verifica os campos obrigatórios.
  if (!nome || !especie) {
    removerFotoEnviada();
    return res.status(400).json({
      erro: 'Informe o nome e a espécie do animal.'
    });
  }

  // Verifica se a idade é válida.
  if (idade != null && idade !== '' &&
      (!Number.isInteger(Number(idade)) || Number(idade) < 0)) {
    removerFotoEnviada();
    return res.status(400).json({
      erro: 'A idade deve ser um número inteiro maior ou igual a zero.'
    });
  }

  try {
    // Procura o animal antes de atualizar.
    const [animais] = await banco.query(
      'SELECT id_animal, foto FROM animais WHERE id_animal = ?',
      [id]
    );

    // Impede a edição de um animal inexistente.
    if (animais.length === 0) {
      removerFotoEnviada();
      return res.status(404).json({
        erro: 'Animal não encontrado.'
      });
    }

    // Mantém a foto antiga quando nenhuma foto nova é enviada.
    const foto = req.file
      ? '/uploads/' + req.file.filename
      : animais[0].foto;

    // Atualiza o cadastro existente.
    await banco.query(
      `UPDATE animais
       SET nome = ?,
           especie = ?,
           raca = ?,
           idade = ?,
           meses = ?,
           porte = ?,
           sexo = ?,
           status_adocao = ?,
           descricao = ?,
           foto = ?
       WHERE id_animal = ?`,
      [
        nome,
        especie,
        raca || null,
        idade === '' || idade == null ? null : Number(idade),
        Number(meses),
        porte || null,
        sexo || null,
        status || 'Disponível',
        descricao || null,
        foto,
        id
      ]
    );

    // Confirma que os dados foram atualizados.
    return res.json({
      mensagem: 'Animal atualizado com sucesso!',
      id: id
    });

  } catch (erro) {
    console.error('Erro ao atualizar animal:', erro);

    removerFotoEnviada();

    return res.status(500).json({
      erro: 'Não foi possível atualizar o animal.'
    });
  }
});

// Excluir um animal cadastrado.
app.delete('/api/animais/:id', autenticarAdmin, async (req, res) => {

  // Recebe o ID do animal.
  const id = Number(req.params.id);

  // Verifica se o ID é válido.
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      erro: 'ID do animal inválido.'
    });
  }

  try {
    // Exclui o animal identificado pelo ID.
    const [resultado] = await banco.query(
      'DELETE FROM animais WHERE id_animal = ?',
      [id]
    );

    // Verifica se algum animal foi encontrado.
    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: 'Animal não encontrado.'
      });
    }

    // Confirma a exclusão.
    return res.json({
      mensagem: 'Animal excluído com sucesso!'
    });

  } catch (erro) {
    console.error('Erro ao excluir animal:', erro);

    return res.status(500).json({
      erro: 'Não foi possível excluir o animal.'
    });
  }
});

// Buscar os eventos cadastrados no banco de dados.
app.get('/api/eventos', async (req, res) => {
  //Cria um endereço público no backend para consultar os eventos cadastrados

  try {
    // Consulta os eventos no MySQL.
    const [eventos] = await banco.query(
      //Executa a consulta no MySQL e guarda os
      //registros encontrados na variável eventos
      `SELECT
        id_evento AS id,
        titulo,
        descricao,
        DATE_FORMAT(dia, '%Y-%m-%d') AS data,
        TIME_FORMAT(horario, '%H:%i') AS hora,
        localizacao AS local,
        status_evento AS status
       FROM eventos
       ORDER BY dia ASC, horario ASC`
    );

    // Envia os eventos para o frontend.
    return res.json(eventos);

  } catch (erro) {
    console.error('Erro ao buscar eventos:', erro);

    return res.status(500).json({
      erro: 'Não foi possível buscar os eventos.'
    });
  }
});

// Cadastrar um novo evento no banco de dados.
app.post('/api/eventos', autenticarAdmin, async (req, res) => {

  // Recebe os dados enviados pelo formulário.
  const { titulo, descricao, data, hora, local, status } = req.body;

  // Verifica os campos obrigatórios.
  if (!titulo || !data || !local || !status) {
    return res.status(400).json({
      erro: 'Preencha o título, a data, o local e o status.'
    });
  }

  // Verifica se o horário foi informado.
  if (!hora) {
    return res.status(400).json({
      erro: 'Informe o horário do evento.'
    });
  }

  // Verifica se o status é permitido.
  if (!['Publicado', 'Rascunho', 'Cancelado'].includes(status)) {
    return res.status(400).json({
      erro: 'Status do evento inválido.'
    });
  }

  // Verifica o formato da data e do horário.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    return res.status(400).json({
      erro: 'Informe uma data e um horário válidos.'
    });
  }

  try {
    // Salva o evento no MySQL.
    const [resultado] = await banco.query(
      `INSERT INTO eventos
       (titulo, descricao, dia, horario, localizacao, status_evento, id_usuario)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        titulo,
        descricao || null,
        data,
        hora,
        local,
        status,
        req.usuario.id
      ]
    );

    // Confirma o cadastro.
    return res.status(201).json({
      mensagem: 'Evento cadastrado com sucesso!',
      id: resultado.insertId
    });

  } catch (erro) {
    console.error('Erro ao cadastrar evento:', erro);

    return res.status(500).json({
      erro: 'Não foi possível cadastrar o evento.'
    });
  }
});

// Rota responsável por autenticar o administrador.
app.post('/api/login', async (req, res) => {
  //Abre a rota responsável por autenticar o administrador
  const { email, senha } = req.body;
  //Guarda os dados informados no formulário de login

  // Verifica se o usuário preencheu os dois campos.
  if (!email || !senha) {
    return res.status(400).json({
      erro: 'Informe o e-mail e a senha.'
    });
  }

  try {
    // Procura um usuário ativo com o e-mail informado.
    const [usuarios] = await banco.query('SELECT id_usuario, nome, email, senha, tipo FROM usuario WHERE email = ? AND ativo = 1 LIMIT 1',[email]);
    //O servidor agora busca também se o usuário é principal ou comum
    const usuario = usuarios[0];

    // Não informa qual dos dois dados está incorreto.
    if (!usuario) {
      return res.status(401).json({
        erro: 'E-mail ou senha inválidos.'
      });
    }

    // Compara a senha digitada com o hash salvo no MySQL.
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({
        erro: 'E-mail ou senha inválidos.'
      });
    }

    // Cria um token para identificar o administrador autenticado.
    const token = jwt.sign(
      { id: usuario.id_usuario },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo
      }
    });

  } catch (erro) {
    console.error('Erro ao realizar login:', erro);

    res.status(500).json({
      erro: 'Não foi possível realizar o login.'
    });
  }
});

// Cadastra um novo administrador no sistema.
// Apenas o administrador principal pode realizar esta ação.
app.post('/api/usuarios', autenticarAdmin, exigirAdminPrincipal, async (req, res) => {
  //exige login e permissão de administrador principal

  // Recebe os dados enviados pelo formulário.
  const { nome, email, senha, tipo } = req.body;

  // Verifica se todos os campos foram preenchidos.
  if (!nome || !email || !senha) {
    return res.status(400).json({
      erro: 'Informe o nome, o e-mail e a senha.'
    });
  }

  // Remove espaços extras do nome e do e-mail.
  const nomeLimpo = String(nome).trim();
  const emailLimpo = String(email).trim().toLowerCase();

  // Verifica se o nome e o e-mail são válidos.
  if (!nomeLimpo || nomeLimpo.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo) ||
      emailLimpo.length > 150) {
    return res.status(400).json({
      erro: 'Informe um nome e um e-mail válidos.'
    });
  }

  // Exige uma senha com pelo menos 8 caracteres.
  if (typeof senha !== 'string' || senha.length < 8 || senha.length > 72) {
    return res.status(400).json({
      erro: 'A senha deve ter entre 8 e 72 caracteres.'
    });
  }

  // Verifica se o tipo de usuário escolhido é permitido.
  if (!['principal', 'comum'].includes(tipo)) {
    return res.status(400).json({
    erro: 'Selecione um tipo de usuário válido.'
  });}

  try {
    // Verifica se o e-mail já está cadastrado.
    const [usuarios] = await banco.query(
      'SELECT id_usuario FROM usuario WHERE email = ? LIMIT 1',
      [emailLimpo]
    );

    if (usuarios.length > 0) {
      return res.status(409).json({
        erro: 'Este e-mail já está cadastrado.'
      });
    }

    // Protege a senha antes de armazená-la no banco.
    const senhaProtegida = await bcrypt.hash(senha, 12);

    // Cadastra o novo usuário como administrador comum e ativo.
    // Cadastra o novo usuário como ativo, com o tipo escolhido.
    const [resultado] = await banco.query(`INSERT INTO usuario (nome, email, senha, ativo, tipo)VALUES (?, ?, ?, 1, ?)`,[nomeLimpo, emailLimpo, senhaProtegida, tipo]);
    //envia os quatro valores para o MySQL

    // Confirma que o administrador foi cadastrado.
    return res.status(201).json({
      mensagem: 'Administrador cadastrado com sucesso!',
      id: resultado.insertId
    });

  } catch (erro) {
    // Trata também e-mails duplicados detectados pelo próprio MySQL.
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        erro: 'Este e-mail já está cadastrado.'
      });
    }

    console.error('Erro ao cadastrar administrador:', erro);

    return res.status(500).json({
      erro: 'Não foi possível cadastrar o administrador.'
    });
  }
});

// Lista os usuários cadastrados no sistema.
// Apenas administradores principais podem visualizar essa lista.
app.get('/api/usuarios', autenticarAdmin, exigirAdminPrincipal, async (req, res) => {

  try {
    // Busca os usuários cadastrados no banco de dados.
    const [usuarios] = await banco.query(
      `SELECT id_usuario, nome, email, tipo, ativo
       FROM usuario
       ORDER BY id_usuario DESC`
    );

    // Envia a lista de usuários para o navegador.
    return res.json(usuarios);

  } catch (erro) {
    // Registra o erro no terminal para facilitar a identificação.
    console.error('Erro ao listar usuários:', erro);

    // Informa ao navegador que não foi possível carregar a lista.
    return res.status(500).json({
      erro: 'Não foi possível carregar os usuários cadastrados.'
    });
  }
});

// Desativa um usuário do sistema.
// Apenas administradores principais podem realizar esta ação.
app.delete('/api/usuarios/:id', autenticarAdmin, exigirAdminPrincipal, async (req, res) => {

  // Recebe o ID do usuário que será desativado.
  const idUsuario = Number(req.params.id);

  // Verifica se o ID informado é válido.
  if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
    return res.status(400).json({
      erro: 'ID do usuário inválido.'
    });
  }

  // Impede que o administrador desative a própria conta.
  if (idUsuario === req.usuario.id) {
    return res.status(403).json({
      erro: 'Você não pode excluir sua própria conta.'
    });
  }

  // Usaremos uma transação para proteger a verificação dos administradores.
  let conexao;

  try {
    conexao = await banco.getConnection();

    await conexao.beginTransaction();

    // Bloqueia os administradores principais ativos durante a operação.
    const [principais] = await conexao.query(
      `SELECT id_usuario
       FROM usuario
       WHERE tipo = 'principal' AND ativo = 1
       FOR UPDATE`
    );

    // Busca o usuário que será desativado.
    const [usuarios] = await conexao.query(
      `SELECT id_usuario, tipo, ativo
       FROM usuario
       WHERE id_usuario = ?
       FOR UPDATE`,
      [idUsuario]
    );

    if (usuarios.length === 0) {
      await conexao.rollback();

      return res.status(404).json({
        erro: 'Usuário não encontrado.'
      });
    }

    const usuario = usuarios[0];

    if (usuario.ativo === 0) {
      await conexao.rollback();

      return res.status(409).json({
        erro: 'Este usuário já está desativado.'
      });
    }

    // Impede a desativação do último administrador principal.
    if (usuario.tipo === 'principal' && principais.length <= 1) {
      await conexao.rollback();

      return res.status(403).json({
        erro: 'Não é possível excluir o último administrador principal ativo.'
      });
    }

    // Exclui definitivamente o usuário do banco de dados.
    await conexao.query('DELETE FROM usuario WHERE id_usuario = ?',[idUsuario]);

    await conexao.commit();

    return res.json({
      mensagem: 'Usuário excluído com sucesso!'
    });

  } catch (erro) {
    if (conexao) {
      await conexao.rollback();
    }

    console.error('Erro ao excluir usuário:', erro);

    return res.status(500).json({
      erro: 'Não foi possível desativar o usuário.'
    });

  } finally {
    if (conexao) {
      conexao.release();
    }
  }
});

// Atualiza um evento já cadastrado.
app.put('/api/eventos/:id', autenticarAdmin, async (req, res) => {

  // Identifica o evento que será atualizado pegando o ID.
  const id = Number(req.params.id);

  // Recebe os dados do formulário.
  const { titulo, descricao, data, hora, local, status } = req.body;

  // Valida o ID.
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'ID do evento inválido.' });
  }

  // Verifica os campos obrigatórios.
  if (!titulo || !data || !hora || !local || !status) {
    return res.status(400).json({
      erro: 'Preencha o título, a data, a hora, o local e o status.'
    });
  }

  // Verifica o status.
  if (!['Publicado', 'Rascunho', 'Cancelado'].includes(status)) {
    return res.status(400).json({
      erro: 'Status do evento inválido.'
    });
  }

  // Verifica o formato da data e do horário.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    return res.status(400).json({
      erro: 'Informe uma data e um horário válidos.'
    });
  }

  try {
    // Atualiza os dados no MySQL.
    const [resultado] = await banco.query(
      `UPDATE eventos
       SET titulo = ?,
           descricao = ?,
           dia = ?,
           horario = ?,
           localizacao = ?,
           status_evento = ?
       WHERE id_evento = ?`,
      [
        titulo,
        descricao || null,
        data,
        hora,
        local,
        status,
        id
      ]
    );

    // Verifica se o evento existe.
    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: 'Evento não encontrado.'
      });
    }

    // Confirma a atualização.
    return res.json({
      mensagem: 'Evento atualizado com sucesso!',
      id
    });

  } catch (erro) {
    console.error('Erro ao atualizar evento:', erro);

    return res.status(500).json({
      erro: 'Não foi possível atualizar o evento.'
    });
  }
});

// Excluir um evento cadastrado.
app.delete('/api/eventos/:id', autenticarAdmin, async (req, res) => {
  //Cria uma rota protegida para excluir um evento pelo ID

  // Recebe o ID do evento.
  const id = Number(req.params.id);
  //Identifica qual evento o administrador deseja excluir

  // Verifica se o ID é válido.
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      erro: 'ID do evento inválido.'
    });
  }

  try {
    // Exclui o evento do MySQL.
    const [resultado] = await banco.query(
      'DELETE FROM eventos WHERE id_evento = ?',
      [id]
    );

    // Verifica se o evento foi encontrado.
    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: 'Evento não encontrado.'
      });
    }

    // Confirma a exclusão.
    return res.json({
      mensagem: 'Evento excluído com sucesso!'
    });

  } catch (erro) {
    console.error('Erro ao excluir evento:', erro);

    return res.status(500).json({
      erro: 'Não foi possível excluir o evento.'
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'projeto-ong', 'index.html'));
}); //Quando alguém acessar http://localhost:3001/, o servidor enviará o arquivo index.html

console.log('ARQUIVO EM EXECUÇÃO:', __filename);
// inicia o servidor depois de configurar as rotas.

// Buscar as estatísticas reais para o painel administrativo.
app.get('/api/estatisticas', autenticarAdmin, async (req, res) => {
  try {
    // Conta os animais disponíveis para adoção.
    const [disponiveis] = await banco.query(
      `SELECT COUNT(*) AS total
       FROM animais
       WHERE status_adocao = 'Disponível'`
    );

    // Conta os animais adotados.
    const [adotados] = await banco.query(
      `SELECT COUNT(*) AS total
       FROM animais
       WHERE status_adocao = 'Adotado'`
    );

    // Conta os eventos publicados.
    const [eventos] = await banco.query(
      `SELECT COUNT(*) AS total
       FROM eventos
       WHERE status_evento = 'Publicado'`
    );

    // Envia os números para o painel.
    return res.json({
      animais_disponiveis: disponiveis[0].total,
      animais_adotados: adotados[0].total,
      eventos_publicados: eventos[0].total,

      // Temporário: ainda vamos conectar os voluntários.
      voluntarios_novas: 0
    });

  } catch (erro) {
    console.error('Erro ao buscar estatísticas:', erro);

    return res.status(500).json({
      erro: 'Não foi possível carregar as estatísticas.'
    });
  }
});

// Cadastrar uma nova inscrição de voluntário.
app.post('/api/voluntarios', async (req, res) => {
  // Recebe os dados enviados pelo formulário público.
  const {
    nome,
    email,
    telefone,
    area_interesse,
    disponibilidade,
    motivacao
  } = req.body;

  // Verifica se os campos obrigatórios foram preenchidos.
  if (
    typeof nome !== 'string' || !nome.trim() ||
    typeof email !== 'string' || !email.trim() ||
    typeof telefone !== 'string' || !telefone.trim() ||
    typeof area_interesse !== 'string' || !area_interesse.trim() ||
    typeof disponibilidade !== 'string' || !disponibilidade.trim()
  ) {
    return res.status(400).json({
      erro: 'Preencha todos os campos obrigatórios.'
    });
  }

  // Verifica os limites definidos no banco de dados.
  if (
    nome.trim().length > 100 ||
    email.trim().length > 150 ||
    telefone.trim().length > 20 ||
    area_interesse.trim().length > 100 ||
    disponibilidade.trim().length > 100
  ) {
    return res.status(400).json({
      erro: 'Um ou mais campos ultrapassaram o limite permitido.'
    });
  }

  // Verifica se o e-mail tem um formato básico válido.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({
      erro: 'Informe um e-mail válido.'
    });
  }

  // Verifica se a motivação, quando enviada, é um texto.
  if (motivacao != null && typeof motivacao !== 'string') {
    return res.status(400).json({
      erro: 'A motivação informada é inválida.'
    });
  }

  try {
    // Salva a inscrição na tabela voluntario do MySQL.
    const [resultado] = await banco.query(
      `INSERT INTO voluntario
       (nome, email, telefone, area_interesse, disponibilidade, motivacao)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nome.trim(),
        email.trim(),
        telefone.trim(),
        area_interesse.trim(),
        disponibilidade.trim(),
        motivacao?.trim() || null
      ]
    );

    // Confirma que a inscrição foi recebida.
    return res.status(201).json({
      mensagem: 'Inscrição enviada com sucesso!',
      id: resultado.insertId
    });

  } catch (erro) {
    console.error('Erro ao cadastrar voluntário:', erro);

    return res.status(500).json({
      erro: 'Não foi possível enviar a inscrição.'
    });
  }
});

// Buscar as inscrições de voluntários no MySQL.
app.get('/api/voluntarios', autenticarAdmin, async (req, res) => {
  try {
    // Consulta as inscrições cadastradas.
    const [voluntarios] = await banco.query(
      `SELECT
        id_voluntario AS id,
        nome,
        email,
        telefone,
        area_interesse,
        disponibilidade,
        motivacao,
        status_inscricao AS status
       FROM voluntario
       ORDER BY id_voluntario DESC`
    );

    // Envia a lista para o painel administrativo.
    return res.json(voluntarios);

  } catch (erro) {
    console.error('Erro ao buscar voluntários:', erro);

    return res.status(500).json({
      erro: 'Não foi possível carregar as inscrições.'
    });
  }
});

// Excluir uma inscrição de voluntário do MySQL.
app.delete('/api/voluntarios/:id', autenticarAdmin, async (req, res) => {

  // Recebe o ID da inscrição.
  const id = Number(req.params.id);

  // Verifica se o ID é válido.
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      erro: 'ID da inscrição inválido.'
    });
  }

  try {
    // Exclui a inscrição correspondente ao ID informado.
    const [resultado] = await banco.query(
      'DELETE FROM voluntario WHERE id_voluntario = ?',
      [id]
    );

    // Verifica se a inscrição foi encontrada.
    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: 'Inscrição não encontrada.'
      });
    }

    // Confirma a exclusão.
    return res.json({
      mensagem: 'Inscrição excluída com sucesso!'
    });

  } catch (erro) {
    console.error('Erro ao excluir inscrição:', erro);

    return res.status(500).json({
      erro: 'Não foi possível excluir a inscrição.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:${PORT}/`);
});
