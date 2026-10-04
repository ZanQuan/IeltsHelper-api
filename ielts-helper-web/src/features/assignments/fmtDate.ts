

export function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('vi-VN');
}
