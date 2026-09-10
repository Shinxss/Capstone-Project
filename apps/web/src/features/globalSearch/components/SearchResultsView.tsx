import SearchCategoryTabs from "./SearchCategoryTabs";
import SearchSection from "./SearchSection";
import { EmptySearchState, SearchResultsSkeleton } from "./SearchResultsStates";
import { useSearchResults } from "../hooks/useSearchResults";

type SearchResultsViewProps = {
  portalPathPrefix?: string;
};

export default function SearchResultsView({ portalPathPrefix = "/lgu" }: SearchResultsViewProps) {
  const search = useSearchResults(portalPathPrefix);

  return (
    <main className="w-full space-y-5 px-4 py-4 sm:px-6 lg:px-8">
      <SearchCategoryTabs
        selectedCategory={search.selectedCategory}
        counts={search.categoryCounts}
        onSelect={search.setSelectedCategory}
      />

      {search.error ? (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
          {search.error} Showing the records that are currently available.
        </div>
      ) : null}

      {search.loading ? (
        <SearchResultsSkeleton />
      ) : search.visibleGroups.length === 0 ? (
        <EmptySearchState query={search.query} onClear={search.clearSearch} />
      ) : (
        <div className="space-y-5">
          {search.visibleGroups.map((group) => (
            <SearchSection
              key={group.category}
              group={group}
              onViewAll={() => search.setSelectedCategory(group.category)}
              onOpenItem={search.openItem}
            />
          ))}
        </div>
      )}
    </main>
  );
}
