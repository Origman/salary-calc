const CBR_RATES_URL = "https://www.cbr.ru/scripts/XML_daily.asp";

function parseRate(xml, code) {
  const pattern = new RegExp(
    `<CharCode>${code}</CharCode>[\\s\\S]*?<Value>([^<]+)</Value>`,
    "i"
  );
  const match = xml.match(pattern);

  if (!match) {
    throw new Error(`Rate ${code} not found`);
  }

  return Number(match[1].replace(",", "."));
}

function parseDate(xml) {
  const match = xml.match(/<ValCurs[^>]*Date="([^"]+)"/i);
  if (!match) {
    throw new Error("Rate date not found");
  }
  return match[1];
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const response = await fetch(CBR_RATES_URL, {
      headers: {
        "User-Agent": "salary-calc-vercel"
      }
    });

    if (!response.ok) {
      throw new Error(`CBR responded with ${response.status}`);
    }

    const xml = await response.text();
    const usd = parseRate(xml, "USD");
    const eur = parseRate(xml, "EUR");
    const date = parseDate(xml);

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({
      source: "CBR",
      date,
      rates: {
        USD: usd,
        EUR: eur
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Unable to load current exchange rates",
      details: error.message
    });
  }
};
