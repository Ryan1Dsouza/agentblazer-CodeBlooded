import { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackgroundScene from '../three/BackgroundScene';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.title = 'AgentBlazer - CodeBlooded';
  }, []);

  return (
    <div className="app-layout">
      <BackgroundScene />
      <Header />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}
