interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="row-center-10 mt-16">
      <button className="btn btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>← Trước</button>
      <span className="muted">Trang {page}/{totalPages}</span>
      <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Sau →</button>
    </div>
  );
}