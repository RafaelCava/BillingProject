export const ACCOUNT_EXAMPLE = {
  _id: '67c89db3344a8f2b8393d0a1',
  name: 'Empresa XPTO',
  email: 'financeiro@empresa.com',
  cnpj: '12.345.678/0001-90',
  plan: 'premium',
  createdAt: '2026-03-10T12:00:00.000Z',
  updatedAt: '2026-03-10T12:00:00.000Z',
};

export const USER_EXAMPLE = {
  _id: '67c89db3344a8f2b8393d0b1',
  name: 'Maria Silva',
  email: 'maria@empresa.com',
  account: '67c89db3344a8f2b8393d0a1',
  role: 'user',
  createdAt: '2026-03-10T12:00:00.000Z',
  updatedAt: '2026-03-10T12:00:00.000Z',
};

export const ADMIN_USER_EXAMPLE = {
  ...USER_EXAMPLE,
  email: 'financeiro@empresa.com',
  role: 'admin',
};

export const PURCHASE_EXAMPLE = {
  _id: '67c89db3344a8f2b8393d0c1',
  account: '67c89db3344a8f2b8393d0a1',
  user: '67c89db3344a8f2b8393d0b1',
  purchaseDate: '2026-03-10T00:00:00.000Z',
  totalAmount: 249.9,
  installmentsCount: 3,
  installmentsEndDate: '2026-05-10T00:00:00.000Z',
  dueDate: '2026-03-10T00:00:00.000Z',
  tagIds: ['67c89db3344a8f2b8393d0d1'],
  createdAt: '2026-03-10T12:00:00.000Z',
  updatedAt: '2026-03-10T12:00:00.000Z',
};

export const PURCHASE_UPDATED_EXAMPLE = {
  ...PURCHASE_EXAMPLE,
  totalAmount: 320.5,
  installmentsCount: 5,
  installmentsEndDate: '2026-07-10T00:00:00.000Z',
  dueDate: '2026-04-10T00:00:00.000Z',
  updatedAt: '2026-03-11T12:00:00.000Z',
};

export const TAG_EXAMPLE = {
  _id: '67c89db3344a8f2b8393d0d1',
  account: '67c89db3344a8f2b8393d0a1',
  name: 'Alimentacao',
  color: '#22C55E',
  createdAt: '2026-03-10T12:00:00.000Z',
  updatedAt: '2026-03-10T12:00:00.000Z',
};

export const TAG_UPDATED_EXAMPLE = {
  ...TAG_EXAMPLE,
  name: 'Transporte',
  color: '#3B82F6',
  updatedAt: '2026-03-11T12:00:00.000Z',
};

export const SUCCESS_EXAMPLE = { success: true };

export const UNAUTHORIZED_EXAMPLE = {
  statusCode: 401,
  message: 'Token ausente ou inválido.',
  error: 'Unauthorized',
};

export const FORBIDDEN_EXAMPLE = {
  statusCode: 403,
  message: 'Perfil sem permissão para acessar este recurso.',
  error: 'Forbidden',
};

export const VALIDATION_ERROR_EXAMPLE = {
  statusCode: 400,
  message: ['campo invalido'],
  error: 'Bad Request',
};