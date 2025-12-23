import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GA4Request {
  startDate?: string;
  endDate?: string;
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  // Base64url encode
  const base64url = (obj: any) => {
    const json = JSON.stringify(obj);
    const base64 = btoa(json);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  };

  const headerB64 = base64url(header);
  const payloadB64 = base64url(payload);
  const signatureInput = `${headerB64}.${payloadB64}`;

  // Import private key and sign
  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    console.error("Token response:", tokenData);
    throw new Error("Failed to get access token: " + JSON.stringify(tokenData));
  }
  
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get("GA4_SERVICE_ACCOUNT_JSON");
    const propertyId = Deno.env.get("GA4_PROPERTY_ID");

    if (!serviceAccountJson || !propertyId) {
      throw new Error("GA4 credentials not configured");
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);

    const { startDate = "7daysAgo", endDate = "today" }: GA4Request = await req.json().catch(() => ({}));

    console.log(`Fetching GA4 data for property ${propertyId} from ${startDate} to ${endDate}`);

    // Fetch main metrics
    const metricsResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: "screenPageViews" },
            { name: "totalUsers" },
            { name: "sessions" },
            { name: "bounceRate" },
            { name: "averageSessionDuration" },
          ],
        }),
      }
    );

    const metricsData = await metricsResponse.json();
    console.log("Metrics response:", JSON.stringify(metricsData));

    // Fetch daily breakdown
    const dailyResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "date" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "totalUsers" },
            { name: "sessions" },
          ],
          orderBys: [{ dimension: { dimensionName: "date" } }],
        }),
      }
    );

    const dailyData = await dailyResponse.json();

    // Fetch traffic sources
    const sourcesResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: 5,
        }),
      }
    );

    const sourcesData = await sourcesResponse.json();

    // Fetch top pages
    const pagesResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 5,
        }),
      }
    );

    const pagesData = await pagesResponse.json();

    // Fetch device breakdown
    const devicesResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "deviceCategory" }],
          metrics: [{ name: "sessions" }],
        }),
      }
    );

    const devicesData = await devicesResponse.json();

    // Parse metrics
    const metrics = metricsData.rows?.[0]?.metricValues || [];
    const pageViews = parseInt(metrics[0]?.value || "0");
    const users = parseInt(metrics[1]?.value || "0");
    const sessions = parseInt(metrics[2]?.value || "0");
    const bounceRate = parseFloat(metrics[3]?.value || "0") * 100;
    const avgSessionDuration = parseFloat(metrics[4]?.value || "0");

    // Parse daily data
    const dailyTraffic = (dailyData.rows || []).map((row: any) => ({
      date: row.dimensionValues[0].value,
      pageViews: parseInt(row.metricValues[0].value),
      visitors: parseInt(row.metricValues[1].value),
      sessions: parseInt(row.metricValues[2].value),
    }));

    // Parse sources
    const totalSourceSessions = (sourcesData.rows || []).reduce(
      (sum: number, row: any) => sum + parseInt(row.metricValues[0].value),
      0
    );
    const trafficSources = (sourcesData.rows || []).map((row: any) => ({
      name: row.dimensionValues[0].value,
      value: Math.round((parseInt(row.metricValues[0].value) / totalSourceSessions) * 100),
    }));

    // Parse top pages
    const topPages = (pagesData.rows || []).map((row: any) => ({
      page: row.dimensionValues[0].value,
      views: parseInt(row.metricValues[0].value),
    }));

    // Parse devices
    const totalDeviceSessions = (devicesData.rows || []).reduce(
      (sum: number, row: any) => sum + parseInt(row.metricValues[0].value),
      0
    );
    const devices = (devicesData.rows || []).map((row: any) => ({
      name: row.dimensionValues[0].value,
      value: Math.round((parseInt(row.metricValues[0].value) / totalDeviceSessions) * 100),
    }));

    // Format session duration
    const minutes = Math.floor(avgSessionDuration / 60);
    const seconds = Math.round(avgSessionDuration % 60);
    const formattedDuration = `${minutes}m ${seconds}s`;

    return new Response(
      JSON.stringify({
        summary: {
          pageViews,
          users,
          sessions,
          bounceRate: `${bounceRate.toFixed(1)}%`,
          avgSessionDuration: formattedDuration,
        },
        dailyTraffic,
        trafficSources,
        topPages,
        devices,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("GA4 Analytics Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
