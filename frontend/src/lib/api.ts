export const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Error response structure from backend
export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp?: string;
  path?: string;
}

// Generate a simple user ID for demo purposes
export const getUserId = (): string => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
};

// API error class
export class ApiError extends Error {
  constructor(
    public status: number,
    public response: ErrorResponse,
    message?: string
  ) {
    super(message || response.message);
    this.name = 'ApiError';
  }
}

// Generic fetch wrapper with better error handling
async function fetchWithErrorHandling<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers,
    },
  });

  if (!res.ok) {
    try {
      const errorData = await res.json();
      throw new ApiError(res.status, errorData);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      // Fallback for non-JSON error responses
      throw new ApiError(res.status, {
        code: 'UNKNOWN_ERROR',
        message: `HTTP ${res.status}: ${res.statusText}`,
      });
    }
  }

  // Handle no-content responses
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export async function get<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Add timestamp to prevent caching
  const separator = path.includes('?') ? '&' : '?';
  const timestampedPath = `${path}${separator}_t=${Date.now()}`;
  
  return fetchWithErrorHandling<T>(timestampedPath, {
    method: 'GET',
    ...options,
  });
}

export async function post<T>(path: string, data?: any, options: RequestInit = {}): Promise<T> {
  return fetchWithErrorHandling<T>(path, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}

export async function patch<T>(path: string, data: any, options: RequestInit = {}): Promise<T> {
  return fetchWithErrorHandling<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options,
  });
}

export async function del<T>(path: string, data?: any, options: RequestInit = {}): Promise<T> {
  return fetchWithErrorHandling<T>(path, {
    method: 'DELETE',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}

// Specialized API functions for comments and reactions
export async function postComment<T>(
  announcementId: string,
  data: any,
  options: RequestInit = {}
): Promise<T> {
  const userId = getUserId();
  return post<T>(`/announcements/${announcementId}/comments`, data, {
    ...options,
    headers: {
      'x-user-id': userId,
      ...options.headers,
    },
  });
}

export async function getComments<T>(
  announcementId: string,
  cursor?: string,
  limit?: number
): Promise<T> {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  if (limit) params.append('limit', limit.toString());

  const queryString = params.toString();
  const path = `/announcements/${announcementId}/comments${queryString ? `?${queryString}` : ''}`;

  return get<T>(path);
}

export async function postReaction<T>(
  announcementId: string,
  data: any,
  options: RequestInit = {}
): Promise<T> {
  const userId = getUserId();
  return post<T>(`/announcements/${announcementId}/reactions`, data, {
    ...options,
    headers: {
      'x-user-id': userId,
      ...options.headers,
    },
  });
}

export async function deleteReaction<T>(
  announcementId: string,
  data?: any,
  options: RequestInit = {}
): Promise<T> {
  const userId = getUserId();
  return del<T>(`/announcements/${announcementId}/reactions`, data, {
    ...options,
    headers: {
      'x-user-id': userId,
      ...options.headers,
    },
  });
}

export async function deleteComment<T>(
  announcementId: string,
  commentId: string,
  options: RequestInit = {}
): Promise<T> {
  const userId = getUserId();
  return del<T>(`/announcements/${announcementId}/comments/${commentId}`, undefined, {
    ...options,
    headers: {
      'x-user-id': userId,
      ...options.headers,
    },
  });
}

export async function getUserReaction<T>(
  announcementId: string,
  options: RequestInit = {}
): Promise<T> {
  const userId = getUserId();
  const timestamp = Date.now();
  return fetchWithErrorHandling<T>(`/announcements/${announcementId}/user-reaction?_t=${timestamp}`, {
    method: 'GET',
    ...options,
    headers: {
      'x-user-id': userId,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers,
    },
  });
}