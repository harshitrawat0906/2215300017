const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = 9876;
const MAX_WINDOW = 10;
const TIME_LIMIT_MS = 500;
const ALLOWED_IDS = ["p", "f", "e", "r"];

app.use(cors());
app.use(express.json());

const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ0OTU0NjYzLCJpYXQiOjE3NDQ5NTQzNjMsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImRlOWQ4YmRlLTAxNjItNDNhYi05ZTUxLTMwYzFmNjAzOWFjNSIsInN1YiI6ImhhcnNoaXQucmF3YXRfY3MuY3NmMjJAZ2xhLmFjLmluIn0sImVtYWlsIjoiaGFyc2hpdC5yYXdhdF9jcy5jc2YyMkBnbGEuYWMuaW4iLCJuYW1lIjoiaGFyc2hpIHJhd2F0Iiwicm9sbE5vIjoiMjIxNTMwMDAxNyIsImFjY2Vzc0NvZGUiOiJDTm5lR1QiLCJjbGllbnRJRCI6ImRlOWQ4YmRlLTAxNjItNDNhYi05ZTUxLTMwYzFmNjAzOWFjNSIsImNsaWVudFNlY3JldCI6Im5XV3FienJQVVdESHFWVEoifQ.ttw_-5uUPaFvGCAWqnU4RDVAX22Qb0JC87yFgCWWS7c";

const dataWindow = {
  p: [],
  f: [],
  e: [],
  r: [],
};

const ENDPOINTS = {
  p: "http://20.244.56.144/evaluation-service/primes",
  f: "http://20.244.56.144/evaluation-service/fibo",
  e: "http://20.244.56.144/evaluation-service/even",
  r: "http://20.244.56.144/evaluation-service/rand",
};

app.get("/series/:typeId", async (req, res) => {
  const { typeId } = req.params;

  if (!ALLOWED_IDS.includes(typeId)) {
    return res.status(400).json({ error: "Invalid series ID" });
  }

  try {
    const start = Date.now();
    let retrieved = [];
    try {
      const response = await axios.get(ENDPOINTS[typeId], {
        timeout: TIME_LIMIT_MS,
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });
      if (response.data && Array.isArray(response.data.numbers)) {
        retrieved = response.data.numbers;
      }
    } catch (err) {
      retrieved = [];
    }
    const duration = Date.now() - start;

    const prevState = [...dataWindow[typeId]];
    let combined = [...new Set([...prevState, ...retrieved])];

    if (combined.length > MAX_WINDOW) {
      combined = combined.slice(-MAX_WINDOW);
    }

    dataWindow[typeId] = combined;

    const avg =
      combined.length > 0
        ? (combined.reduce((a, b) => a + b, 0) / combined.length).toFixed(2)
        : 0;

    const result = {
      windowPrevState: prevState,
      windowCurrState: combined,
      numbers: retrieved,
      avg: parseFloat(avg),
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong on the server." });
  }
});

app.listen(port, () => {});
