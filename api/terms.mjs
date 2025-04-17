import fetch from "node-fetch";

let tokens = []; // Temporary in-memory token storage

export async function handler(event) {
  try {
    const queryParams = new URLSearchParams(event.queryStringParameters);
    const token = queryParams.get("token");

    if (!token) {
      return {
        statusCode: 302,
        headers: { Location: "/terms.html" },
      };
    }

    const decodedToken = Buffer.from(token, "base64").toString();

    if (tokens.includes(decodedToken)) {
      return {
        statusCode: 302,
        headers: { Location: "/terms.html" },
      };
    }

    const ip = event.headers["x-forwarded-for"] || event.headers["client-ip"];
    const ipRes = await fetch(`http://ip-api.com/json/${ip}`);
    const ipData = await ipRes.json();

    if (ipData.proxy || (ipData.as && ipData.as.includes("VPN"))) {
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

    return {
      statusCode: 302,
      headers: { Location: "/terms.html" },
    };
  } catch (error) {
    console.error("Error:", error.message);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
}
