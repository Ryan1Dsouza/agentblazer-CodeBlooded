export default function StatPanel() {
  const stats = [
    { number: '8+', label: 'Workshops & Challenges' },
    { number: '500+', label: 'Engineering Students Reached' },
    { number: 'Salesforce', label: 'Community Partner - Active Trailblazer Mentorship' }
  ];

  return (
    <div className="stat-panel">
      {stats.map((stat, idx) => (
        <div key={idx} className="stat-item">
          <div className="stat-number">{stat.number}</div>
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
