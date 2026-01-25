import Sidebar from "../../components/lgu/Sidebar";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-[#F6F7F9] flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-2xl font-bold text-gray-900">{title}</div>
          <div className="text-sm text-gray-500 mt-1">Placeholder page (coming soon)</div>
        </div>
      </main>
    </div>
  );
}
