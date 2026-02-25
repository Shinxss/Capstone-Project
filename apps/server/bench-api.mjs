import { performance } from "node:perf_hooks";

const BASE = "http://localhost:5000";

// use your seeded admin from .env
const EMAIL = "ad.internconnect@gmail.com";
const PASSWORD = "Lifeline_admin@123";

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.token || data.accessToken;
}

async function optimize(token) {
  const payload = {
    start: { lng: 120.332, lat: 16.043 }, // change to your real start
    end: { lng: 120.341, lat: 16.050 },   // change to your real end
    profile: "driving",
    mode: "optimize",
    weather: { rainfall_mm: 10, is_raining: 1 },
  };

  const t0 = performance.now();
  const res = await fetch(`${BASE}/api/routing/optimize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  await res.json();
  const t1 = performance.now();

  if (!res.ok) throw new Error(`Optimize failed: ${res.status}`);
  return (t1 - t0) / 1000; // seconds
}

async function main() {
  const token = await login();

  const runs = 10;
  const times = [];
  for (let i = 0; i < runs; i++) {
    const sec = await optimize(token);
    times.push(sec);
    console.log(`Run ${i + 1}: ${sec.toFixed(2)} seconds`);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`\nAverage API Call: ${avg.toFixed(2)} seconds`);
}

main().catch(console.error);