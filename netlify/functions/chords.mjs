import { handleChordRequest } from '../../chords-server.mjs';

export async function handler(event) {
  const query = new URLSearchParams(event.queryStringParameters || {});
  let result;
  await handleChordRequest(
    { method: event.httpMethod, url: '/api/chords/search?' + query },
    {
      writeHead(statusCode, headers) { result = { statusCode, headers, body: '' }; },
      end(body) { result.body = body; },
    },
  );
  return result;
}
