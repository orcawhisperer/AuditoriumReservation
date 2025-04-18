import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  
  // Use the correct current page value - either external if provided, or internal
  const currentPage = externalCurrentPage ?? internalCurrentPage;
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  
  // Update internal page when external page changes
  useEffect(() => {
    if (externalCurrentPage !== undefined) {
      setInternalCurrentPage(externalCurrentPage);
    }
  }, [externalCurrentPage]);
  
  // Calculate current items
  useEffect(() => {
    if (!onPageChange) return;
    
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const slicedItems = data.slice(indexOfFirstItem, indexOfLastItem);
    
    onPageChange(slicedItems);
  }, [data, currentPage, itemsPerPage, onPageChange]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    if (onCurrentPageChange) {
      onCurrentPageChange(page);
    } else {
      setInternalCurrentPage(page);
    }
  };
  
  // If there's only one page, don't show pagination
  if (totalPages <= 1) return null;
  
  // Generate page numbers for display
  const pageNumbers = useMemo(() => {
    const numbers = [];
    const maxPageButtons = 5; // Max number of page buttons to show
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    // Adjust start page if end page is at max
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      numbers.push(i);
    }
    
    return numbers;
  }, [currentPage, totalPages]);
  
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-muted-foreground">
          {t('pagination.showing')} {Math.min((currentPage - 1) * itemsPerPage + 1, data.length)} - {Math.min(currentPage * itemsPerPage, data.length)} {t('pagination.of')} {data.length}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {pageNumbers.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="icon"
            onClick={() => handlePageChange(page)}
            className="h-8 w-8"
          >
            {page}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}