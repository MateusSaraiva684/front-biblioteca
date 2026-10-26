const API_URL = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Erro HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  health: () => request("/health"),

  listarLivros: () => request("/api/livros"),

  buscarLivro: (id) => request(`/api/livros/${id}`),

  criarLivro: (livro) =>
    request("/api/livros", {
      method: "POST",
      body: JSON.stringify(livro),
    }),

  atualizarLivro: (id, livro) =>
    request(`/api/livros/${id}`, {
      method: "PUT",
      body: JSON.stringify(livro),
    }),

  excluirLivro: (id) =>
    request(`/api/livros/${id}`, {
      method: "DELETE",
    }),
};