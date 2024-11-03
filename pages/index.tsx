import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/home.module.css";
import ShowOECDData from "@/components/show-oecd-data";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <>
      <Head>
        <title>CRS AI tool</title>
        <meta name="description" content="AI tool using CRS data" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <Link href="./total-country">Totalt bistånd land</Link>
        <Link href="./total-thematic">Totalt bistånd tematik</Link>
        <Link href="./ai-recommendations">AI-förslag Planit </Link>
        <Link href="./ai-trainer">AI-träning</Link>
      </main>
    </>
  );
}
