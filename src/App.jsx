import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./services/api";
import "./App.css";

const Icon = ({ name, size = 20 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" /><path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20" /><path d="M8 7h8" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z" />,
    bookOpen: <><path d="M12 7v14M3 5.5A2.5 2.5 0 0 1 5.5 3H12v18H5.5A2.5 2.5 0 0 0 3 23z" /><path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H12v18h6.5a2.5 2.5 0 0 1 2.5 2z" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" /></>,
  };

  return <svg {...common}>{paths[name] || paths.book}</svg>;
};

const EMPTY_FORM = { titulo: "", autor: "", ano: "" };

function App() {
  const [livros, setLivros] = useState([]);
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editando, setEditando] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregarLivros = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const [dados] = await Promise.all([
        api.listarLivros(),
        api.health(),
      ]);

      if (!Array.isArray(dados)) {
        throw new Error("A API não retornou uma lista de livros.");
      }

      setLivros(dados);
      setApiOnline(true);
    } catch (error) {
      setApiOnline(false);
      setErro(
        `Não foi possível carregar os livros. ${error.message}. Verifique a API e a configuração de CORS.`
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarLivros();
  }, [carregarLivros]);

  useEffect(() => {
    if (!sucesso) return;
    const timer = setTimeout(() => setSucesso(""), 3500);
    return () => clearTimeout(timer);
  }, [sucesso]);

  const livrosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return livros;

    return livros.filter((livro) =>
      [livro.titulo, livro.autor, livro.ano]
        .some((valor) => String(valor ?? "").toLocaleLowerCase("pt-BR").includes(termo))
    );
  }, [livros, busca]);

  function abrirCadastro() {
    setForm(EMPTY_FORM);
    setEditando(null);
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(livro) {
    setForm({
      titulo: livro.titulo ?? "",
      autor: livro.autor ?? "",
      ano: livro.ano == null ? "" : String(livro.ano),
    });
    setEditando(livro);
    setErro("");
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;
    setModalAberto(false);
    setEditando(null);
    setForm(EMPTY_FORM);
  }

  async function salvarLivro(event) {
    event.preventDefault();
    setErro("");
    setSalvando(true);

    const dados = {
      titulo: form.titulo.trim(),
      autor: form.autor.trim(),
      ano: form.ano.trim() ? Number(form.ano) : null,
    };

    if (!dados.titulo || !dados.autor) {
      setErro("Preencha o título e o autor.");
      setSalvando(false);
      return;
    }

    if (dados.ano !== null && (!Number.isInteger(dados.ano) || dados.ano < 0 || dados.ano > 2100)) {
      setErro("Informe um ano válido.");
      setSalvando(false);
      return;
    }

    try {
      if (editando) {
        await api.atualizarLivro(editando.id, dados);
        setSucesso("Livro atualizado com sucesso!");
      } else {
        await api.criarLivro(dados);
        setSucesso("Livro cadastrado com sucesso!");
      }

      setModalAberto(false);
      setEditando(null);
      setForm(EMPTY_FORM);
      await carregarLivros();
    } catch (error) {
      setErro(`Não foi possível salvar o livro: ${error.message}`);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirLivro(livro) {
    const confirmado = window.confirm(
      `Tem certeza de que deseja excluir "${livro.titulo}"?`
    );
    if (!confirmado) return;

    setErro("");
    setSucesso("");

    try {
      await api.excluirLivro(livro.id);
      setLivros((atuais) => atuais.filter((item) => item.id !== livro.id));
      setSucesso("Livro excluído com sucesso!");
    } catch (error) {
      setErro(`Não foi possível excluir o livro: ${error.message}`);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" aria-label="Página inicial da biblioteca">
          <span className="brand-icon"><Icon name="bookOpen" size={25} /></span>
          <span className="brand-copy">
            <strong>Livraria</strong>
            <small>PAINEL DE GESTÃO</small>
          </span>
        </a>

        <div className="nav-label">MENU PRINCIPAL</div>
        <nav className="sidebar-nav">
          <a className="nav-item" href="#inicio">
            <Icon name="dashboard" />
            <span>Visão geral</span>
          </a>
          <a className="nav-item active" href="#biblioteca">
            <Icon name="book" />
            <span>Minha biblioteca</span>
            <span className="nav-count">{livros.length}</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className={`api-card ${apiOnline ? "online" : "offline"}`}>
            <span className="status-dot" />
            <div>
              <strong>{apiOnline ? "API conectada" : "API desconectada"}</strong>
              <small>{apiOnline ? "Sistema operacional" : "Verifique a conexão"}</small>
            </div>
          </div>
          <div className="sidebar-footer">
            <span className="footer-logo"><Icon name="bookOpen" size={17} /></span>
            <span>Biblioteca Digital</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="inicio">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Biblioteca</span>
            <span className="breadcrumb-separator">/</span>
            <strong>Minha coleção</strong>
          </div>
          <div className="topbar-right">
            <span className={`connection-label ${apiOnline ? "connected" : ""}`}>
              <span className="status-dot" />
              {apiOnline ? "Conectado" : "Verificando conexão"}
            </span>
            <div className="avatar">B</div>
          </div>
        </header>

        <section className="page-content" id="biblioteca">
          <div className="page-heading">
            <div>
              <div className="eyebrow">SEU ESPAÇO DE LEITURA</div>
              <h1>Minha biblioteca<span className="heading-dot">.</span></h1>
              <p>Organize, explore e gerencie sua coleção de livros.</p>
            </div>
            <button className="button button-primary" onClick={abrirCadastro}>
              <Icon name="plus" size={19} />
              <span>Adicionar livro</span>
            </button>
          </div>

          <section className="welcome-banner">
            <div className="welcome-decoration decoration-one" />
            <div className="welcome-decoration decoration-two" />
            <div className="welcome-text">
              <span className="banner-label">BIBLIOTECA DIGITAL</span>
              <h2>Histórias que merecem<br />um lugar na sua coleção.</h2>
              <p>Seu conhecimento começa com uma página.</p>
            </div>
            <div className="banner-illustration" aria-hidden="true">
              <div className="illustration-book book-back" />
              <div className="illustration-book book-middle" />
              <div className="illustration-book book-front"><span /></div>
              <div className="illustration-sparkle">✦</div>
            </div>
          </section>

          <section className="stats-grid" aria-label="Resumo da biblioteca">
            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon purple"><Icon name="bookOpen" size={22} /></span>
                <span className="stat-caption">COLEÇÃO</span>
              </div>
              <div className="stat-number">{carregando ? "—" : livros.length}</div>
              <div className="stat-description">Livros cadastrados</div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon blue"><Icon name="book" size={22} /></span>
                <span className="stat-caption">AUTORES</span>
              </div>
              <div className="stat-number">
                {new Set(livros.map((livro) => livro.autor?.trim()).filter(Boolean)).size}
              </div>
              <div className="stat-description">Autores na coleção</div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon green"><Icon name="check" size={22} /></span>
                <span className="stat-caption">SISTEMA</span>
              </div>
              <div className="stat-number stat-status">
                <span className={`status-dot ${apiOnline ? "dot-online" : "dot-offline"}`} />
                {apiOnline ? "Online" : "Offline"}
              </div>
              <div className="stat-description">Conexão com a API</div>
            </article>
          </section>

          <section className="library-panel">
            <div className="panel-heading">
              <div>
                <h2>Todos os livros</h2>
                <p>Gerencie os títulos da sua coleção.</p>
              </div>
              <button className="button button-secondary refresh-button" onClick={carregarLivros} disabled={carregando}>
                <Icon name="refresh" size={17} />
                <span>{carregando ? "Carregando..." : "Atualizar"}</span>
              </button>
            </div>

            <div className="library-toolbar">
              <label className="search-box">
                <Icon name="search" size={19} />
                <input
                  type="search"
                  placeholder="Buscar por título, autor ou ano..."
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  aria-label="Buscar livros"
                />
                {busca && (
                  <button className="clear-search" onClick={() => setBusca("")} aria-label="Limpar pesquisa">
                    <Icon name="close" size={16} />
                  </button>
                )}
              </label>
              <span className="results-count">
                {livrosFiltrados.length} {livrosFiltrados.length === 1 ? "livro" : "livros"}
              </span>
            </div>

            {erro && !modalAberto && (
              <div className="alert alert-error" role="alert">
                <span>{erro}</span>
                <button onClick={() => setErro("")} aria-label="Fechar mensagem">
                  <Icon name="close" size={17} />
                </button>
              </div>
            )}

            {sucesso && <div className="alert alert-success" role="status">{sucesso}</div>}

            {carregando ? (
              <div className="loading-state">
                <div className="spinner" />
                <strong>Carregando sua biblioteca</strong>
                <span>Estamos buscando os seus livros...</span>
              </div>
            ) : livrosFiltrados.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Icon name={busca ? "search" : "bookOpen"} size={30} /></div>
                <h3>{busca ? "Nenhum resultado encontrado" : "Sua biblioteca está começando"}</h3>
                <p>
                  {busca
                    ? "Experimente pesquisar por outro título ou autor."
                    : "Adicione seu primeiro livro e comece a organizar sua coleção."}
                </p>
                {busca ? (
                  <button className="button button-secondary" onClick={() => setBusca("")}>Limpar pesquisa</button>
                ) : (
                  <button className="button button-primary" onClick={abrirCadastro}>
                    <Icon name="plus" size={18} /> Adicionar primeiro livro
                  </button>
                )}
              </div>
            ) : (
              <div className="table-wrap">
                <table className="books-table">
                  <thead>
                    <tr>
                      <th>OBRA</th>
                      <th>AUTOR</th>
                      <th>ANO</th>
                      <th className="actions-heading">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {livrosFiltrados.map((livro) => (
                      <tr key={livro.id}>
                        <td>
                          <div className="book-cell">
                            <span className="book-cover"><Icon name="bookOpen" size={19} /></span>
                            <div className="book-info">
                              <strong>{livro.titulo}</strong>
                              <small>ID #{livro.id}</small>
                            </div>
                          </div>
                        </td>
                        <td><span className="author-name">{livro.autor}</span></td>
                        <td><span className="year-badge">{livro.ano ?? "—"}</span></td>
                        <td>
                          <div className="row-actions">
                            <button className="icon-button edit-button" onClick={() => abrirEdicao(livro)} aria-label={`Editar ${livro.titulo}`} title="Editar livro">
                              <Icon name="edit" size={17} />
                            </button>
                            <button className="icon-button delete-button" onClick={() => excluirLivro(livro)} aria-label={`Excluir ${livro.titulo}`} title="Excluir livro">
                              <Icon name="trash" size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="panel-footer">
              <span>Biblioteca Digital</span>
              <span>{livrosFiltrados.length} de {livros.length} registros</span>
            </div>
          </section>

          <footer className="page-footer">
            <span>Feito para organizar suas melhores histórias.</span>
            <span><Icon name="heart" size={14} /> Leitura transforma.</span>
          </footer>
        </section>
      </main>

      {modalAberto && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) fecharModal();
        }}>
          <section className="book-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-header">
              <div className="modal-icon"><Icon name={editando ? "edit" : "plus"} size={21} /></div>
              <button className="icon-button modal-close" onClick={fecharModal} aria-label="Fechar formulário">
                <Icon name="close" />
              </button>
            </div>
            <h2 id="modal-title">{editando ? "Editar livro" : "Adicionar novo livro"}</h2>
            <p className="modal-subtitle">
              {editando ? "Atualize as informações desta obra." : "Preencha os dados para adicionar à sua coleção."}
            </p>

            <form onSubmit={salvarLivro}>
              <label className="form-field">
                <span>Título do livro <b>*</b></span>
                <input
                  autoFocus
                  required
                  maxLength={200}
                  placeholder="Ex.: O Pequeno Príncipe"
                  value={form.titulo}
                  onChange={(event) => setForm({ ...form, titulo: event.target.value })}
                />
              </label>
              <label className="form-field">
                <span>Autor <b>*</b></span>
                <input
                  required
                  maxLength={150}
                  placeholder="Ex.: Antoine de Saint-Exupéry"
                  value={form.autor}
                  onChange={(event) => setForm({ ...form, autor: event.target.value })}
                />
              </label>
              <label className="form-field">
                <span>Ano de publicação <small>(opcional)</small></span>
                <input
                  type="number"
                  min="0"
                  max="2100"
                  step="1"
                  placeholder="Ex.: 1943"
                  value={form.ano}
                  onChange={(event) => setForm({ ...form, ano: event.target.value })}
                />
              </label>

              {erro && <div className="alert alert-error form-error" role="alert">{erro}</div>}

              <div className="modal-actions">
                <button type="button" className="button button-secondary" onClick={fecharModal} disabled={salvando}>
                  Cancelar
                </button>
                <button type="submit" className="button button-primary" disabled={salvando}>
                  {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar livro"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;