import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMetadata } from "../types/completedTask.types";

type Props = { pagination: PaginationMetadata; onPageChange: (page: number) => void };

function pageNumbers(current: number, total: number) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  return Array.from(pages).filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
}

export default function CompletedTasksPagination({ pagination, onPageChange }: Props) {
  const pages = pageNumbers(pagination.page, pagination.totalPages);
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 dark:border-[#1C2940] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{pagination.firstItem}–{pagination.lastItem}</span> of{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{pagination.totalItems}</span> results
      </p>
      <div className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          aria-label="Previous page"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#293852] dark:text-slate-300 dark:hover:bg-[#152037]"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((page, index) => {
          const previous = pages[index - 1];
          return (
            <span key={page} className="contents">
              {previous !== undefined && page - previous > 1 ? <span className="px-1 text-slate-400">…</span> : null}
              <button
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={page === pagination.page ? "page" : undefined}
                aria-label={`Page ${page}`}
                className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                  page === pagination.page
                    ? "bg-red-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-[#293852] dark:text-slate-300 dark:hover:bg-[#152037]"
                }`}
              >
                {page}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          aria-label="Next page"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#293852] dark:text-slate-300 dark:hover:bg-[#152037]"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
