import { NavLink, Outlet } from 'react-router-dom';
import { StatusPill } from './ui';

export function Layout() {
  return (
    <div className="mes-shell">
      <aside className="mes-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">RF</div>
          <div>
            <strong>ReviewForge</strong>
            <span>MES Platform</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end>
            Operations Overview
          </NavLink>
          <NavLink to="/lessons">Lessons Learned</NavLink>
        </nav>
        <div className="sidebar-footer">
          <span>v1.0 · Virtual Design Review</span>
        </div>
      </aside>

      <div className="mes-main">
        <header className="mes-topbar">
          <div className="topbar-left">
            <span className="live-indicator" />
            <span className="live-label">LIVE</span>
            <span className="topbar-divider">|</span>
            <span className="topbar-sub">Mechanical Engineering · Design Review</span>
          </div>
          <div className="topbar-right">
            <StatusPill status="nominal" label="Hybrid AI Active" />
          </div>
        </header>
        <main className="mes-content">
          <Outlet />
        </main>
        <footer className="mes-footer">
          <span>ReviewForge MES v1.0</span>
          <span className="footer-divider">|</span>
          <span>Trimesh · pgvector · React Three Fiber</span>
        </footer>
      </div>
    </div>
  );
}
