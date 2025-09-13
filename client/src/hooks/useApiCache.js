import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const useApiCache = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const {
    headers = {},
    params = {},
    cacheKey = url,
    enabled = true,
    refetchOnMount = false,
    ...axiosOptions
  } = options;

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    // Check cache first
    const cachedData = cache.get(cacheKey);
    const now = Date.now();
    
    if (!forceRefresh && cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
      setData(cachedData.data);
      setLoading(false);
      setError(null);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const response = await axios({
        url,
        method: 'GET',
        headers,
        params,
        signal: abortControllerRef.current.signal,
        ...axiosOptions
      });

      const responseData = response.data;
      
      // Cache the data
      cache.set(cacheKey, {
        data: responseData,
        timestamp: now
      });

      setData(responseData);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [url, headers, params, cacheKey, enabled, axiosOptions]);

  const invalidateCache = useCallback(() => {
    cache.delete(cacheKey);
  }, [cacheKey]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    if (enabled) {
      fetchData(refetchOnMount);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, enabled, refetchOnMount]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidateCache
  };
};

export default useApiCache;
