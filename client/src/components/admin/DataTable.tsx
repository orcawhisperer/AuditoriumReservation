import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { DataPagination } from "@/components/data-pagination";
import { ArrowDown, ArrowUp, Search } from "lucide-react";

export interface Column<T> {
  header: string;
  accessorKey: string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<T> {
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
  searchKeys,
  pageSize = 10,
  className = "",
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [currentItems, setCurrentItems] = useState<T[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  
  // Handle search
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    // If searchKeys are provided, only search in those keys
    if (searchKeys && searchKeys.length > 0) {
      return data.filter((item) => {
        return searchKeys.some((key) => {
          const value = (item as any)[key];
          return value !== undefined && 
                 String(value).toLowerCase().includes(lowerCaseSearchTerm);
        });
      });
    }
    
    // Otherwise, search in all keys that are strings or numbers
    return data.filter((item) => {
      return Object.entries(item as Record<string, any>).some(([key, value]) => {
        // Skip complex objects in search unless they are specifically requested
        if (value === null || value === undefined) return false;
        if (typeof value === "object") return false;
        
        return String(value).toLowerCase().includes(lowerCaseSearchTerm);
      });
    });
  }, [data, searchTerm, searchKeys]);
  
  // Handle sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];
      
      if (aValue === bValue) return 0;
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return sortConfig.direction === "asc" ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortConfig.direction === "asc" ? 1 : -1;
      
      // Compare by type
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc" 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Numeric comparison
      return sortConfig.direction === "asc" 
        ? (aValue > bValue ? 1 : -1) 
        : (aValue < bValue ? 1 : -1);
    });
  }, [filteredData, sortConfig]);
  
  // Sort handler
  const requestSort = useCallback((key: string) => {
    setSortConfig((prevSortConfig) => {
      if (!prevSortConfig || prevSortConfig.key !== key) {
        return { key, direction: "asc" };
      }
      
      if (prevSortConfig.direction === "asc") {
        return { key, direction: "desc" };
      }
      
      return null; // Reset sorting
    });
  }, []);
  
  // Get sort direction for UI
  const getSortDirection = useCallback((key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction;
  }, [sortConfig]);
  
  return (
    <div className={`w-full ${className}`}>
      {searchable && (
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('dataTable.search')}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}
      
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((column) => (
                  <th
                    key={column.accessorKey}
                    className={`px-4 py-3 text-left font-medium ${
                      column.sortable ? "cursor-pointer" : ""
                    }`}
                    onClick={() => column.sortable && requestSort(column.accessorKey)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.header}</span>
                      {column.sortable && (
                        <span className="inline-flex w-4">
                          {getSortDirection(column.accessorKey) === "asc" && (
                            <ArrowUp className="h-4 w-4" />
                          )}
                          {getSortDirection(column.accessorKey) === "desc" && (
                            <ArrowDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {t('dataTable.noData')}
                  </td>
                </tr>
              ) : (
                currentItems.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    {columns.map((column) => (
                      <td key={column.accessorKey} className="px-4 py-3">
                        {column.cell
                          ? column.cell(row)
                          : (row as any)[column.accessorKey]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <DataPagination
        data={sortedData}
        itemsPerPage={pageSize}
        onPageChange={setCurrentItems}
      />
    </div>
  );
}