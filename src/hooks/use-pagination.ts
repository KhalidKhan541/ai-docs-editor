"use client";

import * as React from "react";

interface UsePaginationOptions {
  totalItems: number;
  itemsPerPage: number;
  initialPage?: number;
  siblingCount?: number;
}

interface UsePaginationResult {
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  startIndex: number;
  endIndex: number;
  pages: (number | "ellipsis")[];
}

function usePagination({
  totalItems,
  itemsPerPage,
  initialPage = 1,
  siblingCount = 1,
}: UsePaginationOptions): UsePaginationResult {
  const [currentPage, setCurrentPage] = React.useState(initialPage);

  const totalPages = React.useMemo(
    () => Math.ceil(totalItems / itemsPerPage),
    [totalItems, itemsPerPage]
  );

  const canGoNext = currentPage < totalPages;
  const canGoPrevious = currentPage > 1;

  const startIndex = React.useMemo(
    () => (currentPage - 1) * itemsPerPage,
    [currentPage, itemsPerPage]
  );

  const endIndex = React.useMemo(
    () => Math.min(startIndex + itemsPerPage - 1, totalItems - 1),
    [startIndex, itemsPerPage, totalItems]
  );

  const generatePages = React.useCallback((): (number | "ellipsis")[] => {
    const totalNumbers = siblingCount * 2 + 5;

    if (totalPages <= totalNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

    if (!showLeftEllipsis && showRightEllipsis) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "ellipsis", totalPages];
    }

    if (showLeftEllipsis && !showRightEllipsis) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [1, "ellipsis", ...rightRange];
    }

    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [1, "ellipsis", ...middleRange, "ellipsis", totalPages];
  }, [totalPages, currentPage, siblingCount]);

  const pages = React.useMemo(() => generatePages(), [generatePages]);

  const goToPage = React.useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    },
    [totalPages]
  );

  const goToNextPage = React.useCallback(() => {
    if (canGoNext) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [canGoNext]);

  const goToPreviousPage = React.useCallback(() => {
    if (canGoPrevious) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [canGoPrevious]);

  const goToFirstPage = React.useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = React.useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  return {
    currentPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    pages,
  };
}

export { usePagination };
