// pages/api/predict.js
export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { description } = req.body;

      const response = await fetch("http://localhost:5001/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
      });

      if (response.ok) {
        const data = await response.json();
        res.status(200).json(data);
      } else {
        res
          .status(response.status)
          .json({ error: "Error communicating with the prediction API" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}