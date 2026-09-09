import { useState, useMemo } from "react";

export function usePaginatedList<T>(items: T[], pageSize: number = 10) {
  const [page, setPage] = useState(1);

  const { pageItems, totalPages, currentPage, start } = useMemo(() => {
    const total = Math.max(1, Math.ceil(items.length / pageSize));
    const current = Math.min(Math.max(1, page), total);
    const startIndex = (current - 1) * pageSize;
    
    return {
      totalPages: total,
      currentPage: current,
      start: startIndex,
      pageItems: items.slice(startIndex, startIndex + pageSize),
    };
  }, [items, page, pageSize]);

  return { 
    page, 
    setPage, 
    pageItems, 
    totalPages, 
    currentPage, 
    start 
  };
}