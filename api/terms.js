const fs = require("fs");
const fetch = require("node-fetch");

exports.handler = async (event) => {
  const queryParams = new URLSearchParams(event.queryStringParameters);
  const token = queryParams.get("token");

  if (!token) {
    return {
      statusCode: 302,
      headers: { Location: "/terms.html" },
    };
  }

  const decodedToken = Buffer.from(token, "base64").toString();
  const tokens = JSON.parse(fs.readFileSync("./tokens.json", "utf8") || "[]");

  if (tokens.includes(decodedToken)) {
    return {
      statusCode: 302,
      headers: { Location: "/terms.html" },
    };
  }

  const ip = event.headers["x-forwarded-for"] || event.headers["client-ip"];
  const ipRes = await fetch(`http://ip-api.com/json/${ip}`);
  const ipData = await ipRes.json();

  if (ipData.proxy || ipData.as.includes("VPN")) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "VPN detected. Disconnect VPN and try again." }),
    };
  }

  await fetch(decodedToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      country: ipData.country,
      countryCode: ipData.countryCode,
      timezone: ipData.timezone,
    }),
  });

  tokens.push(decodedToken);
  fs.writeFileSync("./tokens.json", JSON.stringify(tokens));

  return {
    statusCode: 302,
    headers: { Location: "/terms.html" },
  };
};
