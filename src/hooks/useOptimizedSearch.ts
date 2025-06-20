import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { debounce } from 'lodash-es';

interface SearchOptions {
  searchTerm?: string;
  location?: string;
  jobType?: string;
  source?: string;
  limit?: number;
  offset?: number;
}

interface SearchResult {
  id: string;
  created_at: string;
  job_title: string;
  company_name: string;
  location: string;
  salary: string;
  job_type: string;
  deadline: string;
  job_link: string;
  recruiter_name: string;
  email_snippet: string;
  source: string;
  responsibilities: string[];
  requirements: string[];
  duration: string;
  website: string;
  search_rank?: number;
}

export function useOptimizedSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Debounced search function to avoid excessive API calls
  const debouncedSearch = useCallback(
    debounce(async (options: SearchOptions) => {
      try {
        setLoading(true);
        
        // Try optimized search function first
        const { data, error } = await supabase
          .rpc('search_job_opportunities', {
            p_search_term: options.searchTerm || '',
            p_location: options.location || '',
            p_job_type: options.jobType || '',
            p_source: options.source || '',
            p_limit: options.limit || 50,
            p_offset: options.offset || 0
          });

        if (error) {
          console.warn('Optimized search not available, falling back to regular query');
          await fallbackSearch(options);
          return;
        }

        setResults(data || []);
        setTotalCount(data?.length || 0);
      } catch (error) {
        console.error('Search error:', error);
        await fallbackSearch(options);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const fallbackSearch = async (options: SearchOptions) => {
    try {
      let query = supabase
        .from('job_leads')
        .select('*')
        .eq('is_valid_opportunity', true);

      // Apply filters
      if (options.location) {
        query = query.eq('location', options.location);
      }
      if (options.jobType) {
        query = query.eq('job_type', options.jobType);
      }
      if (options.source) {
        query = query.eq('source', options.source);
      }

      // Apply text search if provided
      if (options.searchTerm) {
        query = query.or(`job_title.ilike.%${options.searchTerm}%,company_name.ilike.%${options.searchTerm}%,location.ilike.%${options.searchTerm}%,email_snippet.ilike.%${options.searchTerm}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

      if (error) throw error;
      
      setResults(data || []);
      setTotalCount(data?.length || 0);
    } catch (error) {
      console.error('Fallback search error:', error);
      setResults([]);
      setTotalCount(0);
    }
  };

  const search = useCallback((options: SearchOptions) => {
    debouncedSearch(options);
  }, [debouncedSearch]);

  const clearSearch = useCallback(() => {
    setResults([]);
    setTotalCount(0);
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  // Memoized filter options for performance
  const filterOptions = useMemo(() => {
    const locations = [...new Set(results.map(job => job.location).filter(Boolean))];
    const jobTypes = [...new Set(results.map(job => job.job_type).filter(Boolean))];
    const sources = [...new Set(results.map(job => job.source).filter(Boolean))];

    return { locations, jobTypes, sources };
  }, [results]);

  return {
    results,
    loading,
    totalCount,
    filterOptions,
    search,
    clearSearch
  };
}