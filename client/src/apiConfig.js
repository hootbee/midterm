const stripTrailingSlash = (value) => {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const resolvedApiBase = stripTrailingSlash(process.env.REACT_APP_API_URL || '');

const resolveDefaultSocket = () => {
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const defaultPort = 3280;
    return `${protocol}//${hostname}:${defaultPort}`;
  }
  return 'http://localhost:3280';
};

const SOCKET_BASE_URL = stripTrailingSlash(
  process.env.REACT_APP_SOCKET_URL || resolvedApiBase || resolveDefaultSocket()
);

export const API_BASE_URL = resolvedApiBase;
export const SOCKET_ENDPOINT = SOCKET_BASE_URL;
export const buildApiUrl = (path = '') => `${resolvedApiBase}${path}`;
