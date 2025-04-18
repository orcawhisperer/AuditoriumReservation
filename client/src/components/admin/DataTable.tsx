import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { DataPagination } from "@/components/data-pagination";

interface Column<T> {
  header: string;
  accessorKey: string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchKeys?: string[];
  pageSize?: number;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  searchable = false,
  searchKeys = [],
  pageSize = 10,
  className = "",
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Filter data by search term
  const filteredData = useMemo(() => {
    if (!searchable || !searchTerm.trim()) return data;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return data.filter((item) => {
      // If searchKeys are provided, only search in those keys
      if (searchKeys.length > 0) {
        return searchKeys.some((key) => {
          const value = (item as any)[key];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(lowerSearchTerm);
        });
      }
      
      // Otherwise, search in all keys
      return Object.entries(item as any).some(([_, value]) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerSearchTerm);
      });
    });
  }, [data, searchTerm, searchable, searchKeys]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];
      
      if (aValue === bValue) return 0;
      
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      
      // Handle different types of values for sorting
      if (typeof aValue === "string" && typeof bValue === "string") {
        return aValue.localeCompare(bValue) * direction;
      }
      
      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Get current page data
  const [paginatedData, setPaginatedData] = useState<T[]>([]);

  // Handle sort click
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  // Get sort direction for column
  const getSortDirection = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction;
  };

  // Change detection for search input
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setCurrentPage(1); // Reset to first page on search
    },
    []
  );

  // Empty state renderer
  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={columns.length} className="h-24 text-center">
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <Search className="h-8 w-8 mb-2 opacity-50" />
          <p>{searchTerm ? t('common.noResultsFound') : t('common.noDataAvailable')}</p>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {searchable && (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessorKey}>
                  {column.sortable !== false ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(column.accessorKey)}
                      className="p-0 font-medium flex items-center gap-1 hover:bg-transparent hover:underline"
                    >
                      {column.header}
                      {getSortDirection(column.accessorKey) === "asc" && (
                        <ChevronUp className="h-4 w-4" />
                      )}
                      {getSortDirection(column.accessorKey) === "desc" && (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0
              ? paginatedData.map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.accessorKey}>
                        {column.cell
                          ? column.cell(row)
                          : (row as any)[column.accessorKey]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : renderEmptyState()}
          </TableBody>
        </Table>
      </div>

      {sortedData.length > pageSize && (
        <DataPagination
          data={sortedData}
          itemsPerPage={pageSize}
          onPageChange={setPaginatedData}
          currentPage={currentPage}
          onCurrentPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}