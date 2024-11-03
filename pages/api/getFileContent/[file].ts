import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";

interface Data {
  content?: string;
  error?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const file = req.query.file as string;
  const filePath = `C:/2024/crs_se_mfa_support/public/${file}`;

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    res.status(200).json({ content: content });
  } catch (error) {
    res.status(500).json({ error: "Error reading file" });
  }
}
