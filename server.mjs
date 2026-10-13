const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === "/api/chat" && req.method === "POST") {
    if (!process.env.OPENAI_API_KEY) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        error: "Mbola tsy voapetraka ny API key."
      }));
    }

    let body = "";

    req.on("data", chunk => body += chunk);

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);

        const response = await fetch(
          "https://api.openai.com/v1/responses",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: process.env.OPENAI_MODEL || "gpt-5-mini",
              instructions:
                "Ianao no mpampianatra Baiboly ao amin'ny Ny Baiboly AI. Valio amin'ny teny Malagasy mazava sy manaja. Hazavao amin'ny fomba mora azo ny andinin-teny. Aza mamorona andininy na milaza fa teny mivantana ao amin'ny Baiboly ny zavatra tsy voamarina. Raha tsy azonao antoka dia lazao izany.",
              input: String(data.message || "")
            })
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error?.message || "Nisy olana tamin'ny AI."
          );
        }

        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8"
        });

        res.end(JSON.stringify({
          answer: result.output_text || "Tsy nahazo valiny."
        }));

      } catch (error) {
        res.writeHead(500, {
          "Content-Type": "application/json; charset=utf-8"
        });

        res.end(JSON.stringify({
          error: error.message || "Nisy olana."
        }));
      }
    });

    return;
  }

  const requested = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.join(__dirname, requested);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      return res.end("Tsy hita ilay pejy.");
    }

    const ext = path.extname(filePath);
    const types = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css",
      ".js": "text/javascript",
      ".svg": "image/svg+xml"
    };

    res.writeHead(200, {
      "Content-Type": types[ext] || "application/octet-stream"
    });

    res.end(content);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Ny Baiboly AI dia mandeha amin'ny port " + PORT);
});
