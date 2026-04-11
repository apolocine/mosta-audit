// data-mode.ts — Helper for dual ORM/NET mode
// Author: Dr Hamid MADANI drmdh@msn.com

export function isNetMode(): boolean {
  return process.env.MOSTA_DATA === 'net';
}
