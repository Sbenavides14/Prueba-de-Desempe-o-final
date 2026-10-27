import { useState, FormEvent, useRef, useEffect } from "react";
import { api } from "../api";
import { IconChat, IconAlert } from "../components/icons";

type ChatMessage = { question: string; respuesta: string | null; sql: string | null; rows: any[] | null };

export function Chat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.chat(question);
      setMessages((prev) => [...prev, { question, respuesta: data.respuesta, sql: data.sql_ejecutado, rows: data.resultados }]);
      setQuestion("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Pregúntale a tus datos</h1>
        <p className="page-desc">
          No soy un chat general: solo respondo preguntas sobre tus datos sísmicos (magnitudes, conteos, regiones, fechas).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="filters-bar">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ej: ¿Cuántos eventos tuvieron magnitud mayor a 5 esta semana?"
          style={{ flex: "1 1 400px" }}
        />
        <button disabled={loading} type="submit">{loading ? "Pensando..." : "Preguntar"}</button>
      </form>

      {error && <p className="error-message"><IconAlert size={16} /> {error}</p>}

      {messages.length === 0 && !error && (
        <p className="state-message"><IconChat size={20} /><br /><br />Hazme una pregunta sobre tus datos sísmicos.</p>
      )}

      {messages.map((m, i) => (
        <div key={i} className="chat-bubble">
          <div className="question">{m.question}</div>
          <p className="answer">{m.respuesta}</p>
          {m.sql && (
            <details>
              <summary>Ver consulta y datos crudos</summary>
              <pre style={{ fontSize: 12, background: "#f4f3f0", padding: 10, borderRadius: 6, overflowX: "auto", marginTop: 8 }}>{m.sql}</pre>
              {!m.rows || m.rows.length === 0 ? <p className="state-message" style={{ padding: 12 }}>Sin resultados.</p> : (
                <pre style={{ fontSize: 12, overflowX: "auto" }}>{JSON.stringify(m.rows, null, 2)}</pre>
              )}
            </details>
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
