// src/lib/adminFetch.js

/**
 * Wrapper around fetch that always includes credentials (cookies).
 * Use this in all admin pages instead of raw fetch().
 */
export default function adminFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: 'include',
  })
}