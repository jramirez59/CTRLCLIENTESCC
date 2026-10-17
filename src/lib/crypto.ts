// Cifrado en el navegador: la contraseña maestra nunca se guarda ni se envía.
const enc = new TextEncoder(), dec = new TextDecoder()
export const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b)))
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0))
export const newSalt = () => b64(crypto.getRandomValues(new Uint8Array(16)))
export async function deriveKey(pass: string, salt: string) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: unb64(salt), iterations: 250000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}
export async function encrypt(key: CryptoKey, text: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const c = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text))
  return { c: b64(c), iv: b64(iv) }
}
export async function decrypt(key: CryptoKey, c: string, iv: string) {
  return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(c)))
}
