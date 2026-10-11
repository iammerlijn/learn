import http, { ServerResponse } from "node:http";
import crypto from "node:crypto";

const PORT = 3000;

function sendError(res: ServerResponse, statusCode: number, message: string) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");

  res.end(
    JSON.stringify({
      error: message,
    }),
  );
}

function validateData(data: { email: string; recipient: string }) {
  return (
    data === null ||
    typeof data !== "object" ||
    typeof data.email !== "string" ||
    typeof data.recipient !== "string"
  );
}

const server = http.createServer((req, res) => {
  const requestId = crypto.randomUUID();
  res.setHeader("X-Request-Id", requestId);

  // simple health endpoint
  if (req.method === "GET" && req.url === "/health") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "POST" && req.url === "/jobs") {
    // HTTP streams, so in (plain) node we have to 'create' the body ourselfs.
    let body = "";

    req.on("data", (chunk) => {
      // this will show the buffer
      console.log("chunk", chunk);

      // a chunk is text encoded as UTF-8
      const text = chunk.toString("utf8");
      console.log("text:", text);

      body += text;
    });

    // validate the JSON
    // Optional: validate the JSON to what API requires, e.g. email, recipient
    // Optional: validate the size. since we parse in memory, we can exceed.
    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        // very simple data object validation. We should swap this for zod.
        const dataIsValid = validateData(data);

        if (dataIsValid) {
          res.statusCode = 201;
          res.end(JSON.stringify(data));
        }
      } catch (error) {
        sendError(res, 400, "Invalid job data");
      }
    });

    return;
  }

  res.statusCode = 400;
  res.setHeader("Content-Type", "application/json");

  res.end(
    JSON.stringify({
      error: "Not found",
    }),
  );
});

server.listen(PORT, () => {
  console.log("listen on", PORT);
});
