import { useEffect, useState, useRef, useCallback } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { useTranslation } from "react-i18next";

interface DataPaginationProps<T> {
  data: T[];
  itemsPerPage: number;
  onPageChange?: (currentItems: T[]) => void;
  currentPage?: number;
  onCurrentPageChange?: (page: number) => void;
}

export function DataPagination<T>({
  data,
  itemsPerPage,
  onPageChange,
  currentPage: externalCurrentPage,
  onCurrentPageChange,
}: DataPaginationProps<T>) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(externalCurrentPage || 1);
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  // Memoize the callback to prevent infinite loops
  const stableOnPageChange = useCallback(onPageChange || (() => {}), []);
  
  // Calculate current items and call callback
  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const slicedData = data.slice(indexOfFirstItem, indexOfLastItem);
    
    // Only call if callback exists
    if (onPageChange) {
      onPageChange(slicedData);
    }
  }, [data, currentPage, itemsPerPage, onPageChange]);

  // Sync with external current page if provided
  useEffect(() => {
    if (externalCurrentPage && externalCurrentPage !== currentPage) {
      setCurrentPage(externalCurrentPage);
    }
  }, [externalCurrentPage]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      if (onCurrentPageChange) {
        onCurrentPageChange(page);
      }
    }
  };
  
  // Don't render pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }
  
  // Generate page numbers
  const pageNumbers = () => {
    const pages = [];
    
    // Always show first page
    pages.push(
      <PaginationItem key="page-1">
        <PaginationLink 
          onClick={() => handlePageChange(1)} 
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Add ellipsis if needed
    if (currentPage > 3) {
      pages.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last page as they are always shown
      pages.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink 
            onClick={() => handlePageChange(i)} 
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      pages.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page (if it's not the same as the first)
    if (totalPages > 1) {
      pages.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink 
            onClick={() => handlePageChange(totalPages)} 
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return pages;
  };
  
  return (
    <Pagination className="my-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
          />
        </PaginationItem>
        
        {pageNumbers()}
        
        <PaginationItem>
          <PaginationNext 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}