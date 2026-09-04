import { useState, useCallback, useMemo } from "react";

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  total?: number;
}

interface UsePaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  isFirst: boolean;
  isLast: boolean;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  setLimit: (limit: number) => void;
  setTotal: (total: number) => void;
  goToPage: (page: number) => void;
  getOffset: () => number;
  getPageRange: () => number[];
  getVisiblePages: () => (number | "ellipsis")[];
}

export function usePagination(
  options: UsePaginationOptions = {}
): UsePaginationResult {
  const {
    initialPage = 1,
    initialLimit = 20,
    total: initialTotal = 0,
  } = options;

  const [page, setPageState] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(initialTotal);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const isFirst = page === 1;
  const isLast = page === totalPages;

  const setPage = useCallback(
    (newPage: number) => {
      const clamped = Math.max(1, Math.min(newPage, totalPages));
      setPageState(clamped);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (hasNext) setPageState((p) => p + 1);
  }, [hasNext]);

  const prevPage = useCallback(() => {
    if (hasPrev) setPageState((p) => p - 1);
  }, [hasPrev]);

  const firstPage = useCallback(() => setPageState(1), []);

  const lastPage = useCallback(
    () => setPageState(totalPages),
    [totalPages]
  );

  const goToPage = useCallback(
    (p: number) => setPage(p),
    [setPage]
  );

  const getOffset = useCallback(() => (page - 1) * limit, [page, limit]);

  const getPageRange = useCallback(() => {
    const range: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      range.push(i);
    }
    return range;
  }, [totalPages]);

  const getVisiblePages = useCallback((): (number | "ellipsis")[] => {
    const delta = 2;
    const range: (number | "ellipsis")[] = [];
    const rangeWithDots: (number | "ellipsis")[] = [];

    let l: number;
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - delta && i <= page + delta)
      ) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push("ellipsis");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  }, [page, totalPages]);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    isFirst,
    isLast,
    setPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setLimit,
    setTotal,
    goToPage,
    getOffset,
    getPageRange,
    getVisiblePages,
  };
}
