export default function StatPanel() {
  const stats = [
    { number: '3+', label: 'Workshops & Challenges', isHighlight: false },
    { number: '500+', label: 'Engineering Students Reached', isHighlight: false },
    { number: 'Salesforce', label: 'Community Partner - Active Trailblazer Mentorship', isHighlight: true }
  ];

  return (
    <div className="stat-panel">
      {stats.map((stat, idx) => (
        <div key={idx} className={`stat-item ${stat.isHighlight ? 'stat-item-partner' : ''}`}>
          <div className="stat-number-wrapper">
            <span className="stat-number">{stat.number}</span>
            {stat.isHighlight && (
              <span className="stat-tag" aria-label="Official Partner">PARTNER</span>
            )}
          </div>
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
