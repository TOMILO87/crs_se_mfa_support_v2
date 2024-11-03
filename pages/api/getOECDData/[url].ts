/**
 * url example:
 * "https://sxs-boost-oecd.redpelicans.com/boost-disseminate/v2/sdmx/data/OECD.DCD.FSD,DSD_CRS@DF_CRS,1.1/USA+GBR+CHE+SWE+ESP+SVN+SVK+PRT+POL+NOR+NZL+NLD+LUX+LTU+KOR+JPN+ITA+IRL+ISL+HUN+GRC+DEU+FRA+FIN+EST+DNK+CZE+CAN+BEL+AUT+AUS+DAC..1000.100._T._T.D.V._T..?startPeriod=2013&dimensionAtObservation=AllDimensions";
 */

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const url = req.query.url as string;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
