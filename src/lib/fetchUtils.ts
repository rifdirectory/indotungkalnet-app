/**
 * Safe fetch utility to handle JSON parsing and non-OK responses gracefully.
 * Prevents the "Unexpected token '<'..." error by verifying Content-Type.
 */
interface SafeFetchOptions extends RequestInit {
  silent?: boolean;
}

export async function safeFetch<T = any>(url: string, options?: SafeFetchOptions): Promise<{ success: boolean; data?: T; message?: string }> {
  try {
    const res = await fetch(url, options);
    
    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      if (!options?.silent) {
        console.error(`[safeFetch] Expected JSON but received ${contentType || 'unknown type'}. Body starting with: ${text.substring(0, 100)}`);
      }
      return { 
        success: false, 
        message: `Server returned non-JSON response (${res.status} ${res.statusText})` 
      };
    }

    const data = await res.json();

    if (!res.ok) {
      return { 
        success: false, 
        message: data.message || `Error ${res.status}: ${res.statusText}`,
        data 
      };
    }

    return { success: true, data };
  } catch (error: any) {
    if (!options?.silent) {
      console.error(`[safeFetch] Network or Parsing Error for ${url}:`, error);
    }
    return { success: false, message: error.message || 'Network error' };
  }
}
