import '../styles/pageLoading.css';

export default function PageLoading() {
  return (
    <div className="page-loading" role="status" aria-live="polite" aria-busy="true">
      <span className="page-loading__spinner" aria-hidden="true" />
      <p>Loading page…</p>
    </div>
  );
}
