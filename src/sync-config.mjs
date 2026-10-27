export function validateSyncEndpoint(endpoint, pageProtocol = 'https:') {
  if (!endpoint?.trim()) throw new Error('Falta configurar la dirección del servidor de sincronización.');
  let url;
  try { url = new URL(endpoint.trim()); } catch { throw new Error('Dirección de servidor inválida. Usá wss://tu-servidor/sync.'); }
  if (!['ws:', 'wss:'].includes(url.protocol) || url.username || url.password || url.hash) {
    throw new Error('Dirección de servidor inválida. Usá wss://tu-servidor/sync.');
  }
  if (pageProtocol === 'https:' && url.protocol !== 'wss:') {
    throw new Error('Esta aplicación usa HTTPS. El servidor debe usar wss:// para conectar.');
  }
  return url;
}

export function defaultSyncEndpoint(page, configured = '') {
  if (configured.trim()) return validateSyncEndpoint(configured, page.protocol).href;
  if (page.hostname.endsWith('.netlify.app')) return '';
  return (page.protocol === 'https:' ? 'wss://' : 'ws://') + page.host + '/sync';
}
