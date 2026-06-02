const baseUrl = '/api';

async function fetchJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || response.statusText);
  }

  return response.json();
}

export async function getProducts({ search = '', category = '', lowStock = false } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (lowStock) params.set('lowStock', 'true');

  return fetchJson(`/products?${params.toString()}`);
}

export async function getOrders() {
  return fetchJson('/orders');
}

export async function createOrder(order) {
  return fetchJson('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export async function getSalesReport() {
  return fetchJson('/reports/sales');
}
