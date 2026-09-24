import { useState } from 'react';
import EventBulletin from '../components/community/EventBulletin';
import CommunityVoice from '../components/community/CommunityVoice';
import NexusChat from '../components/community/NexusChat';

type Tab = 'bulletin' | 'voice' | 'chat';

export default function Community() {
  const [activeTab, setActiveTab] = useState<Tab>('bulletin');
  const isAdmin = sessionStorage.getItem('isAdmin') === 'true';

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'bulletin', label: 'Event Bulletin', icon: '📡' },
    { id: 'voice', label: 'Community Voice', icon: '🎙️' },
    { id: 'chat', label: 'Community Chat', icon: '💬' },
  ];

  return (
    <section className="community-page">
      <div className="community-container">
        {/* Page Header */}
        <div className="community-hero">
          <div className="community-hero-text">
            <span className="community-badge">
              {isAdmin && (
                <span className="admin-indicator">
                  🔑 ADMIN
                  <button
                    className="admin-logout-btn"
                    onClick={() => {
                      sessionStorage.removeItem('isAdmin');
                      window.location.reload();
                    }}
                    title="Exit Admin Mode"
                  >
                    ✕ EXIT
                  </button>
                </span>
              )}
              Community Hub
            </span>
            <h1 className="community-title glow-text">AgentBlazer Hub</h1>
            <p className="community-subtitle">
              Your central command for events, community voices, and live chat — powered by AgentBlazer AI
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="community-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`community-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="community-content">
          {activeTab === 'bulletin' && <EventBulletin isAdmin={isAdmin} />}
          {activeTab === 'voice' && <CommunityVoice isAdmin={isAdmin} />}
          {activeTab === 'chat' && <NexusChat />}
        </div>
      </div>
    </section>
  );
}
