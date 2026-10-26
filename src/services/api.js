import { useState, useEffect } from "react";
import TextInput from "./Componentes/TextInput";
import styles from "./App.module.css";

function App() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tweetList, setTweetList] = useState([]);

  // URL do seu backend no Cloudflare Workers (configurada no arquivo .env local ou nas variáveis do Cloudflare Pages)
  const apiUrl = import.meta.env.VITE_API_URL || "https://aula-deploy.mateussaraiva684.workers.dev/";

  // Busca os dados do banco (SELECT) assim que o componente é montado
  useEffect(() => {
    async function carregarTweets() {
      try {
        const resposta = await fetch(`${apiUrl}/tweets`);
        if (resposta.ok) {
          const dados = await resposta.json();
          setTweetList(dados);
        }
      } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
      }
    }
    carregarTweets();
  }, []);

  // Envia os dados para o banco (INSERT) ao clicar no botão
  async function enviar() {
    if (!nome || !email || !mensagem) return; // Validação simples

    const novoTweet = { nome, email, mensagem };

    try {
      const resposta = await fetch(`${apiUrl}/tweets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(novoTweet),
      });

      if (resposta.ok) {
        // Atualiza a lista na tela de forma reativa
        setTweetList([...tweetList, novoTweet]);
        
        // Limpa os campos após o envio
        setNome('');
        setEmail('');
        setMensagem('');
      } else {
        console.error("Erro ao salvar no backend");
      }
    } catch (erro) {
      console.error("Erro de conexão com o backend:", erro);
    }
  }

  return (
    <div className={styles.appContainner}>
      <TextInput placeholder={'NOME'} maxLength={60}
        value={nome} onChange={(e) => setNome(e.target.value)} />

      <TextInput placeholder={'EMAIL'} maxLength={70}
        value={email} onChange={(e) => setEmail(e.target.value)} />

      <TextInput placeholder={'MENSAGEM'} maxLength={250}
        value={mensagem} onChange={(e) => setMensagem(e.target.value)} />

      <button onClick={enviar}>Enviar</button>

      {tweetList.map((tweet, index) => (
        <div key={index}>
          <p>{tweet.nome}</p>
          <p>{tweet.email}</p>
          <p>{tweet.mensagem}</p>
        </div>
      ))}
    </div>
  )
}

export default App;