import { ChevronLeft, ChevronRight } from "lucide-react";
import type { InProgressPagination } from "../types/inProgressTask.types";

type Props = { pagination: InProgressPagination; onPageChange: (page: number) => void };

export default function InProgressTaskPagination({ pagination, onPageChange }: Props) {
  if (pagination.totalItems === 0) return null;
  const pages = Array.from({ length: pagination.totalPages }, (_, index) => index + 1).filter((page) => page === 1 || page === pagination.totalPages || Math.abs(page - pagination.page) <= 1);
  return (
    <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
      <p>Showing <span className="font-bold text-slate-700 dark:text-slate-200">{pagination.startItem}–{pagination.endItem}</span> of <span className="font-bold text-slate-700 dark:text-slate-200">{pagination.totalItems}</span> in-progress emergencies</p>
      <nav aria-label="In-progress tasks pagination" className="flex items-center gap-1">
        <button type="button" aria-label="Previous page" disabled={pagination.page === 1} onClick={() => onPageChange(pagination.page - 1)} className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#24324A] dark:bg-[#0E1626]"><ChevronLeft size={16} /></button>
        {pages.map((page, index) => {
          const previous = pages[index - 1];
          return <span key={page} className="contents">{previous && page - previous > 1 ? <span className="px-1">…</span> : null}<button type="button" aria-current={page === pagination.page ? "page" : undefined} onClick={() => onPageChange(page)} className={`size-9 rounded-lg text-xs font-black ${page === pagination.page ? "bg-red-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#24324A] dark:bg-[#0E1626] dark:text-slate-200"}`}>{page}</button></span>;
        })}
        <button type="button" aria-label="Next page" disabled={pagination.page === pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)} className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#24324A] dark:bg-[#0E1626]"><ChevronRight size={16} /></button>
      </nav>
    </div>
  );
}
