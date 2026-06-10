let tokenGetter = null;

export function setAuthTokenGetter(fn) {
  tokenGetter = fn;
}

export async function getAuthToken() {
  return tokenGetter ? await tokenGetter() : null;
}
