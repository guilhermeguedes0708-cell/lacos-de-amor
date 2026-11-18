# 🐾 Laços de Amor

### Plataforma web de apoio à ONG CPDA – Paraíso da Cacau & Cãopanheiros

**Instituto Federal de Educação, Ciência e Tecnologia de São Paulo (IFSP)**  
**Câmpus Bragança Paulista**  
**Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas**

**Disciplina:** Extensão como Metodologia de Ensino 1 e Desenvolvemento Web
**Professores:** Paulo Cesar Polastri e Ana Paula Muller Giancoli  
**Ano:** 2026

---

## 📖 Sobre o projeto

O **Laços de Amor** é um projeto de extensão desenvolvido por estudantes do curso de Tecnologia em Análise e Desenvolvimento de Sistemas do IFSP – Câmpus Bragança Paulista, em parceria com a **ONG CPDA – Paraíso da Cacau & Cãopanheiros**, localizada em Joanópolis, São Paulo.

A iniciativa surgiu em agosto de 2026, a partir do contato com Paola Paiva, voluntária responsável pelo marketing da organização.

O projeto busca atender à necessidade de melhorar a presença digital da ONG, facilitando a divulgação de animais disponíveis para adoção, eventos, avisos e outras atividades relacionadas à proteção animal.

Além das páginas públicas, a plataforma conta com uma **área administrativa**, permitindo que pessoas autorizadas gerenciem os conteúdos sem precisar modificar diretamente o código do site.

## 🎯 Objetivo geral

Desenvolver uma plataforma web para apoiar a comunicação e o gerenciamento de informações da ONG CPDA – Paraíso da Cacau & Cãopanheiros, ampliando a autonomia na atualização dos conteúdos e facilitando o acesso da comunidade às ações de proteção animal.

## 📌 Objetivos específicos

- Organizar as informações e necessidades de comunicação da ONG.
- Desenvolver páginas públicas para apresentar a instituição, os animais disponíveis para adoção e os eventos.
- Implementar uma área administrativa com autenticação.
- Permitir o cadastro, a consulta e a atualização de informações.
- Integrar o front-end, o back-end e o banco de dados.
- Verificar os principais fluxos de navegação e gerenciamento.
- Documentar o sistema e identificar oportunidades de melhoria.

## 💻 Tecnologias utilizadas

O projeto utiliza as seguintes tecnologias:

- **HTML5:** estrutura das páginas.
- **CSS3:** estilização e adaptação das interfaces.
- **JavaScript:** interatividade e funcionalidades do sistema.
- **Node.js:** execução do back-end em JavaScript.
- **Express:** desenvolvimento das rotas e da API.
- **MySQL:** armazenamento das informações.
- **Git e GitHub:** versionamento e disponibilização do código.

## 🐶 Funcionalidades

### Área pública

- Página inicial com apresentação do projeto e da ONG.
- Visualização de animais disponíveis para adoção.
- Divulgação de eventos e atividades da organização.
- Navegação entre as páginas do site.

### Área administrativa

- Login para usuários autorizados.
- Cadastro e gerenciamento de animais.
- Cadastro e gerenciamento de eventos.
- Integração dos registros com o banco de dados.
- Gerenciamento de usuários administrativos.
- Controle de permissões entre administradores principais e comuns.

A separação entre a área pública e a área administrativa permite que os visitantes consultem as informações da ONG enquanto os responsáveis mantêm os conteúdos atualizados.

## 📁 Estrutura do projeto

```text
projeto-ong-FINAL/
│
├── projeto-ong/
│   ├── css/
│   ├── html/
│   │   └── admin/
│   ├── img/
│   ├── js/
│   └── index.html
│
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

**Descrição dos principais arquivos e pastas:**

- `projeto-ong/`: arquivos do site e das interfaces.
- `projeto-ong/css/`: estilos das páginas.
- `projeto-ong/html/`: páginas HTML adicionais.
- `projeto-ong/html/admin/`: páginas administrativas.
- `projeto-ong/js/`: scripts JavaScript do front-end.
- `projeto-ong/index.html`: página inicial.
- `server.js`: servidor, autenticação e rotas da API.
- `package.json`: dependências e configurações do Node.js.
- `.gitignore`: arquivos e pastas excluídos do versionamento.

## 🚀 Como executar localmente

### Pré-requisitos

- Node.js instalado.
- MySQL instalado e configurado.
- Banco de dados com as tabelas utilizadas pelo sistema.

### Passo a passo

**1. Clone o repositório:**

```bash
git clone URL_DO_REPOSITORIO
```

**2. Acesse a pasta do projeto:**

```bash
cd lacos-de-amor
```

**3. Instale as dependências:**

```bash
npm install
```

**4. Configure as variáveis de ambiente necessárias**, incluindo:

```env
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=3306
JWT_SECRET=
```

Os valores devem ser preenchidos conforme o ambiente local. Não publique senhas ou chaves de autenticação no GitHub.

**5. Prepare o banco de dados MySQL** com a estrutura necessária para o funcionamento do sistema.

**6. Inicie o servidor:**

```bash
node server.js
```

**7. Acesse o endereço local configurado para a aplicação.**

> **Observação:** as funcionalidades de autenticação, cadastro e gerenciamento dependem da execução do servidor Node.js e da conexão com o MySQL.

## 🤝 Extensão e impacto social

O Laços de Amor integra a formação acadêmica à participação da comunidade externa, aplicando conhecimentos de desenvolvimento de software a uma necessidade concreta da ONG CPDA.

A plataforma busca:

- Facilitar a divulgação de animais disponíveis para adoção.
- Incentivar a adoção responsável.
- Ampliar a visibilidade das campanhas e dos eventos.
- Simplificar a atualização das informações institucionais.
- Fortalecer a parceria entre o IFSP e a comunidade.

O projeto está relacionado aos seguintes Objetivos de Desenvolvimento Sustentável (ODS):

- **ODS 17 – Parcerias e Meios de Implementação:** fortalecimento da colaboração entre a instituição de ensino e a organização social.
- **ODS 9 – Indústria, Inovação e Infraestrutura:** aplicação de soluções tecnológicas para melhorar serviços digitais.

## 👥 Equipe

| Integrante | Responsabilidades |
|---|---|
| **Guilherme Rodrigues Guedes** | Back-end, modelagem e integração do banco de dados. |
| **Carlos Daniel da Silva Ferreira** | Front-end administrativo, JavaScript e funcionalidades de gerenciamento. |
| **Vinicius Ladini Mendes** | Back-end em JavaScript, autenticação, validações, integração e documentação. |
| **Erick Prinzhofer** | Front-end das páginas públicas e de login. |

**Orientação acadêmica:** Prof. Paulo Cesar Polastri e Profa. Ana Paula Muller Giancoli.

A equipe oficial de extensão é composta por Guilherme, Carlos Daniel e Vinicius. Erick participa como colaborador técnico pela disciplina de Desenvolvimento Web.

## 🗓️ Desenvolvimento

O projeto teve início em **agosto de 2026**, com o contato com a ONG e o levantamento das necessidades.

O desenvolvimento envolve organização dos conteúdos, criação das interfaces, implementação das funcionalidades administrativas, integração com o banco de dados, testes e documentação.

As apresentações acadêmicas estão previstas para **30 de novembro e 7 de dezembro de 2026**, com possibilidade de melhorias posteriores conforme as necessidades da CPDA.

## 🌐 Publicação

O código-fonte está disponível neste repositório do GitHub.

A publicação do front-end pode ser realizada por meio do Netlify. As funcionalidades que dependem da API e do banco de dados necessitam de hospedagem própria para o back-end.

## 💚 Considerações finais

O **Laços de Amor** demonstra como a tecnologia pode contribuir para iniciativas de proteção animal, reunindo divulgação, organização de informações e ferramentas administrativas em uma única plataforma.

Além do aprendizado técnico, o projeto valoriza a colaboração entre estudantes e comunidade, buscando oferecer uma solução útil para a ONG CPDA – Paraíso da Cacau & Cãopanheiros.