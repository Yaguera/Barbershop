import Link from 'next/link';
export function Pagination({ page, hasMore, path }: { page: number; hasMore: boolean; path: string }) {
  if (page === 1 && !hasMore) return null;
  return <nav aria-label="Paginação" className="flex items-center justify-center gap-6 py-4 text-sm">
    {page > 1 && <Link href={`${path}?page=${page-1}`} className="text-amber-400">Anterior</Link>}
    <span>Página {page}</span>
    {hasMore && <Link href={`${path}?page=${page+1}`} className="text-amber-400">Próxima</Link>}
  </nav>;
}
