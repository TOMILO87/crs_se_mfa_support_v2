import path from "path";
import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { filename } = req.query;

  if (!filename) {
    res.status(400).json({ error: "Filename is required" });
    return;
  }

  const filePath = path.join(process.cwd(), "data", filename as string);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  res.status(200).send(fileContent);
}
