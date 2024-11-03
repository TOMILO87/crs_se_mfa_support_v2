import { useEffect, useState } from "react";

interface DataResponse {
  // Define the structure of the response based on the API
  // Here's an example of a general structure; adjust this according to your needs
  [key: string]: any;
}

export default function ShowOECDData() {
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/getOecdData");
        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }
        const result: DataResponse = await res.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  console.log(data);

  //<pre>{JSON.stringify(data, null, 2)}</pre>;

  return (
    <div>
      <h1>Data</h1>
    </div>
  );
}
