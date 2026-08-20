const PORTFOLIO_ORIGIN = "https://anand-philip-marketing-portfolio.round-egret-4062.chatgpt.site";

const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(request, response) {
  const requestedPath = Array.isArray(request.query.path) ? request.query.path.join("/") : request.query.path || "";
  const incomingUrl = new URL(request.url, "https://anandphilipportfolio.vercel.app");
  const upstreamUrl = new URL(`/${requestedPath}`, PORTFOLIO_ORIGIN);

  for (const [key, value] of incomingUrl.searchParams) {
    if (key !== "path") upstreamUrl.searchParams.append(key, value);
  }

  const headers = new Headers();
  for (const name of ["accept", "accept-language", "content-type", "cookie", "user-agent"]) {
    const value = request.headers[name];
    if (typeof value === "string") headers.set(name, value);
  }

  try {
    const isBodyless = request.method === "GET" || request.method === "HEAD";
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: isBodyless ? undefined : request,
      duplex: isBodyless ? undefined : "half",
    });

    const skippedHeaders = new Set(["connection", "content-encoding", "content-length", "transfer-encoding"]);
    upstreamResponse.headers.forEach((value, name) => {
      if (!skippedHeaders.has(name.toLowerCase())) response.setHeader(name, value);
    });

    const cookies = upstreamResponse.headers.getSetCookie?.() || [];
    if (cookies.length) response.setHeader("set-cookie", cookies);

    response.status(upstreamResponse.status);
    if (request.method === "HEAD") return response.end();
    return response.send(Buffer.from(await upstreamResponse.arrayBuffer()));
  } catch {
    return response.status(502).json({ error: "Portfolio service is temporarily unavailable." });
  }
}

module.exports = handler;
module.exports.config = config;
