/* serve.mjs — servidor estático de desenvolvimento com suporte a HTTP Range.
 *
 *   node serve.mjs [porta]        (padrão 4174)
 *
 * Existe por um motivo específico: `python -m http.server` responde 200 a uma
 * requisição Range em vez de 206. Safari e vários players EXIGEM Range para
 * tocar <video> — com 200 o vídeo da hero simplesmente não começa. O Chromium
 * tolera, o que torna o defeito invisível em alguns navegadores e não em
 * outros. O GitHub Pages atende Range corretamente, então isto é só para o
 * desenvolvimento local espelhar a produção.
 */
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { join, extname, normalize } from "node:path";

const raiz = import.meta.dirname;
const porta = Number(process.argv[2]) || 4174;

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
};

createServer((req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  let rel = normalize(url).replace(/^(\.\.[/\\])+/, "");
  if (rel === "/" || rel.endsWith("/")) rel += "index.html";

  const caminho = join(raiz, rel);
  let st;
  try {
    st = statSync(caminho);
    if (st.isDirectory()) throw new Error("dir");
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    return res.end("404 " + rel);
  }

  const tipo = TIPOS[extname(caminho).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range;

  /* Sem Range: resposta inteira, mas anunciando que aceitamos Range — é esse
     anúncio que faz o player pedir fatias em vez de desistir. */
  if (!range) {
    res.writeHead(200, {
      "content-type": tipo,
      "content-length": st.size,
      "accept-ranges": "bytes",
      "cache-control": "no-cache",
    });
    return createReadStream(caminho).pipe(res);
  }

  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) {
    res.writeHead(416, { "content-range": `bytes */${st.size}` });
    return res.end();
  }
  let ini = m[1] === "" ? null : Number(m[1]);
  let fim = m[2] === "" ? null : Number(m[2]);
  if (ini === null) { ini = st.size - (fim || 0); fim = st.size - 1; }   // sufixo
  if (fim === null) fim = st.size - 1;
  if (ini > fim || ini >= st.size) {
    res.writeHead(416, { "content-range": `bytes */${st.size}` });
    return res.end();
  }

  res.writeHead(206, {
    "content-type": tipo,
    "content-range": `bytes ${ini}-${fim}/${st.size}`,
    "content-length": fim - ini + 1,
    "accept-ranges": "bytes",
    "cache-control": "no-cache",
  });
  createReadStream(caminho, { start: ini, end: fim }).pipe(res);
}).listen(porta, () => {
  console.log(`servindo ${raiz}`);
  console.log(`  http://localhost:${porta}/            (com HTTP Range)`);
});
