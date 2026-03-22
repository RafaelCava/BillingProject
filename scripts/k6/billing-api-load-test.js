import http from 'k6/http';
import { check, fail } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

export const options = {
  scenarios: {
    billing_api_all_routes: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 120,
      maxVUs: 300,
    },
  },
  thresholds: {
    checks: ['rate>=0.95'],
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.05'],
  },
};

function jsonHeaders(cookieHeader) {
  return cookieHeader
    ? { 'Content-Type': 'application/json', Cookie: cookieHeader }
    : { 'Content-Type': 'application/json' };
}

function extractCookieHeader(res) {
  const header = res.headers['Set-Cookie'] || res.headers['set-cookie'];
  if (!header) {
    return '';
  }

  const cookies = Array.isArray(header) ? header : [header];
  return cookies.map((cookie) => cookie.split(';')[0]).join('; ');
}

function uniqueSuffix() {
  return `${Date.now()}-${__VU}-${__ITER}-${Math.floor(Math.random() * 100000)}`;
}

function createAccountPayload(suffix) {
  return {
    name: `Empresa-${suffix}`,
    email: `admin-${suffix}@billing.test`,
    cnpj: '12.345.678/0001-90',
    plan: 'premium',
    password: 'Senha@123',
  };
}

function createUserPayload(suffix) {
  return {
    name: `User-${suffix}`,
    email: `user-${suffix}@billing.test`,
    password: 'Senha@123',
    role: 'user',
  };
}

function createTagPayload(suffix) {
  return {
    name: `Tag-${suffix}`,
    color: '#22C55E',
  };
}

function createPurchasePayload(suffix, tagIds = []) {
  return {
    purchaseDate: new Date().toISOString(),
    totalAmount: 199.9,
    installmentsCount: 1,
    tagIds,
    name: `Compra-${suffix}`,
  };
}

function getTagIdFromResponse(res) {
  const body = res.json();
  return body?.tag?._id || body?.tag?.id || body?.tagId || null;
}

function getPurchaseIdFromResponse(res) {
  const body = res.json();
  return body?.purchase?._id || body?.purchase?.id || body?.purchaseId || null;
}

function loginAndGetCookies(email, password) {
  const loginRes = http.post(
    `${API_BASE}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: jsonHeaders() },
  );

  check(loginRes, {
    'auth/login retorna 200': (r) => r.status === 200,
  });

  return extractCookieHeader(loginRes);
}

function buildSetupData() {
  const suffix = `setup-${Date.now()}`;
  const accountPayload = createAccountPayload(suffix);

  const createAccountRes = http.post(
    `${API_BASE}/accounts`,
    JSON.stringify(accountPayload),
    { headers: jsonHeaders() },
  );

  const accountOk = check(createAccountRes, {
    'setup create account retorna 201': (r) => r.status === 201,
  });

  if (!accountOk) {
    fail(`Falha ao criar conta no setup. Status: ${createAccountRes.status}, body: ${createAccountRes.body}`);
  }

  const authCookie = loginAndGetCookies(accountPayload.email, accountPayload.password);

  if (!authCookie.includes('access_token=')) {
    fail('Falha ao obter cookie access_token no setup.');
  }

  const createTagRes = http.post(
    `${API_BASE}/tags`,
    JSON.stringify(createTagPayload(suffix)),
    { headers: jsonHeaders(authCookie) },
  );

  const tagOk = check(createTagRes, {
    'setup create tag retorna 201': (r) => r.status === 201,
  });

  if (!tagOk) {
    fail(`Falha ao criar tag no setup. Status: ${createTagRes.status}, body: ${createTagRes.body}`);
  }

  const tagId = getTagIdFromResponse(createTagRes);
  if (!tagId) {
    fail(`Falha ao extrair tagId no setup. Body: ${createTagRes.body}`);
  }

  const createPurchaseRes = http.post(
    `${API_BASE}/purchases`,
    JSON.stringify(createPurchasePayload(suffix, [tagId])),
    { headers: jsonHeaders(authCookie) },
  );

  const purchaseOk = check(createPurchaseRes, {
    'setup create purchase retorna 201': (r) => r.status === 201,
  });

  if (!purchaseOk) {
    fail(`Falha ao criar compra no setup. Status: ${createPurchaseRes.status}, body: ${createPurchaseRes.body}`);
  }

  const purchaseId = getPurchaseIdFromResponse(createPurchaseRes);
  if (!purchaseId) {
    fail(`Falha ao extrair purchaseId no setup. Body: ${createPurchaseRes.body}`);
  }

  const createUserRes = http.post(
    `${API_BASE}/user`,
    JSON.stringify(createUserPayload(suffix)),
    { headers: jsonHeaders(authCookie) },
  );

  check(createUserRes, {
    'setup create user retorna 201': (r) => r.status === 201,
  });

  return {
    adminEmail: accountPayload.email,
    adminPassword: accountPayload.password,
    authCookie,
    tagId,
    purchaseId,
  };
}

export function setup() {
  return buildSetupData();
}

function testAccountsCreate() {
  const suffix = uniqueSuffix();
  const res = http.post(
    `${API_BASE}/accounts`,
    JSON.stringify(createAccountPayload(suffix)),
    { headers: jsonHeaders() },
  );

  check(res, {
    'POST /accounts retorna 201': (r) => r.status === 201,
  });
}

function testAccountsListAuth(data) {
  const res = http.get(`${API_BASE}/accounts`, {
    headers: { Cookie: data.authCookie },
  });

  check(res, {
    'GET /accounts autenticado retorna 200': (r) => r.status === 200,
  });
}

function testAuthLogin(data) {
  const res = http.post(
    `${API_BASE}/auth/login`,
    JSON.stringify({ email: data.adminEmail, password: data.adminPassword }),
    { headers: jsonHeaders() },
  );

  check(res, {
    'POST /auth/login retorna 200': (r) => r.status === 200,
    'POST /auth/login define access_token': (r) => extractCookieHeader(r).includes('access_token='),
  });
}

function testAuthRefresh(data) {
  const loginCookie = loginAndGetCookies(data.adminEmail, data.adminPassword);

  const res = http.post(
    `${API_BASE}/auth/refresh`,
    null,
    { headers: { Cookie: loginCookie } },
  );

  check(res, {
    'POST /auth/refresh retorna 200': (r) => r.status === 200,
  });
}

function testAuthLogout(data) {
  const loginCookie = loginAndGetCookies(data.adminEmail, data.adminPassword);

  const res = http.post(
    `${API_BASE}/auth/logout`,
    null,
    { headers: { Cookie: loginCookie } },
  );

  check(res, {
    'POST /auth/logout retorna 200': (r) => r.status === 200,
  });
}

function testProfileAuth(data) {
  const res = http.get(`${API_BASE}/profile`, {
    headers: { Cookie: data.authCookie },
  });

  check(res, {
    'GET /profile autenticado retorna 200': (r) => r.status === 200,
  });
}

function testProfileNoAuth() {
  const res = http.get(`${API_BASE}/profile`);

  check(res, {
    'GET /profile sem auth retorna 401': (r) => r.status === 401,
  });
}

function testGetUserAuth(data) {
  const res = http.get(`${API_BASE}/user?email=${encodeURIComponent(data.adminEmail)}`, {
    headers: { Cookie: data.authCookie },
  });

  check(res, {
    'GET /user autenticado retorna 200': (r) => r.status === 200,
  });
}

function testListUsersAuth(data) {
  const res = http.get(`${API_BASE}/users`, {
    headers: { Cookie: data.authCookie },
  });

  check(res, {
    'GET /users autenticado retorna 200': (r) => r.status === 200,
  });
}

function testCreateUserAuth(data) {
  const suffix = uniqueSuffix();
  const res = http.post(
    `${API_BASE}/user`,
    JSON.stringify(createUserPayload(suffix)),
    { headers: jsonHeaders(data.authCookie) },
  );

  check(res, {
    'POST /user autenticado retorna 201': (r) => r.status === 201,
  });
}

function testTagsCreateAuth(data) {
  const suffix = uniqueSuffix();
  const res = http.post(
    `${API_BASE}/tags`,
    JSON.stringify(createTagPayload(suffix)),
    { headers: jsonHeaders(data.authCookie) },
  );

  check(res, {
    'POST /tags autenticado retorna 201': (r) => r.status === 201,
  });
}

function testTagsListAuth(data) {
  const res = http.get(`${API_BASE}/tags`, {
    headers: { Cookie: data.authCookie },
  });

  check(res, {
    'GET /tags autenticado retorna 200': (r) => r.status === 200,
  });
}

function testTagsGetAuth(data) {
  const res = http.get(`${API_BASE}/tags/${data.tagId}`, {
    headers: { Cookie: data.authCookie },
  });

  check(res, {
    'GET /tags/:id autenticado retorna 200': (r) => r.status === 200,
  });
}

function testTagsUpdateAuth(data) {
  const suffix = uniqueSuffix();
  const res = http.patch(
    `${API_BASE}/tags/${data.tagId}`,
    JSON.stringify({ name: `Tag-Updated-${suffix}`, color: '#16A34A' }),
    { headers: jsonHeaders(data.authCookie) },
  );

  check(res, {
    'PATCH /tags/:id autenticado retorna 200': (r) => r.status === 200,
  });
}

function testTagsDeleteAuth(data) {
  const suffix = uniqueSuffix();
  const createRes = http.post(
    `${API_BASE}/tags`,
    JSON.stringify(createTagPayload(`delete-${suffix}`)),
    { headers: jsonHeaders(data.authCookie) },
  );

  const tagId = getTagIdFromResponse(createRes);
  const createOk = check(createRes, {
    'POST /tags para delete retorna 201': (r) => r.status === 201,
  });

  if (!createOk || !tagId) {
    return;
  }

  const deleteRes = http.del(`${API_BASE}/tags/${tagId}`, null, {
    headers: { Cookie: data.authCookie },
  });

  check(deleteRes, {
    'DELETE /tags/:id autenticado retorna 200': (r) => r.status === 200,
  });
}

function testPurchasesCreateAuth(data) {
  const suffix = uniqueSuffix();
  const res = http.post(
    `${API_BASE}/purchases`,
    JSON.stringify(createPurchasePayload(suffix, [data.tagId])),
    { headers: jsonHeaders(data.authCookie) },
  );

  check(res, {
    'POST /purchases autenticado retorna 201': (r) => r.status === 201,
  });
}

function testPurchasesListAuth(data) {
  const res = http.get(`${API_BASE}/purchases?page=1&limit=20`, {
    headers: { Cookie: data.authCookie },
  });

  check(res, {
    'GET /purchases autenticado retorna 200': (r) => r.status === 200,
  });
}

function testPurchasesGetAuth(data) {
  const res = http.get(`${API_BASE}/purchases/${data.purchaseId}`, {
    headers: { Cookie: data.authCookie },
  });

  check(res, {
    'GET /purchases/:id autenticado retorna 200': (r) => r.status === 200,
  });
}

function testPurchasesUpdateAuth(data) {
  const res = http.patch(
    `${API_BASE}/purchases/${data.purchaseId}`,
    JSON.stringify({ totalAmount: 250.5, installmentsCount: 2 }),
    { headers: jsonHeaders(data.authCookie) },
  );

  check(res, {
    'PATCH /purchases/:id autenticado retorna 200': (r) => r.status === 200,
  });
}

function testPurchasesDeleteAuth(data) {
  const suffix = uniqueSuffix();
  const createRes = http.post(
    `${API_BASE}/purchases`,
    JSON.stringify(createPurchasePayload(`delete-${suffix}`, [data.tagId])),
    { headers: jsonHeaders(data.authCookie) },
  );

  const purchaseId = getPurchaseIdFromResponse(createRes);
  const createOk = check(createRes, {
    'POST /purchases para delete retorna 201': (r) => r.status === 201,
  });

  if (!createOk || !purchaseId) {
    return;
  }

  const deleteRes = http.del(`${API_BASE}/purchases/${purchaseId}`, null, {
    headers: { Cookie: data.authCookie },
  });

  check(deleteRes, {
    'DELETE /purchases/:id autenticado retorna 200': (r) => r.status === 200,
  });
}

function testTagsNoAuth() {
  const res = http.get(`${API_BASE}/tags`);

  check(res, {
    'GET /tags sem auth retorna 401': (r) => r.status === 401,
  });
}

function testPurchasesNoAuth() {
  const res = http.get(`${API_BASE}/purchases`);

  check(res, {
    'GET /purchases sem auth retorna 401': (r) => r.status === 401,
  });
}

const routeTests = [
  testAccountsCreate,
  testAccountsListAuth,
  testAuthLogin,
  testAuthRefresh,
  testAuthLogout,
  testProfileAuth,
  testProfileNoAuth,
  testGetUserAuth,
  testListUsersAuth,
  testCreateUserAuth,
  testTagsCreateAuth,
  testTagsListAuth,
  testTagsGetAuth,
  testTagsUpdateAuth,
  testTagsDeleteAuth,
  testPurchasesCreateAuth,
  testPurchasesListAuth,
  testPurchasesGetAuth,
  testPurchasesUpdateAuth,
  testPurchasesDeleteAuth,
  testTagsNoAuth,
  testPurchasesNoAuth,
];

export default function (data) {
  const testFn = routeTests[__ITER % routeTests.length];
  testFn(data);
}
