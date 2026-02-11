import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/customers', label: 'Customers' },
  { path: '/products', label: 'Products' },
  { path: '/invoices', label: 'Invoices' }
];

export default function Layout({ onLogout, children }) {
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>InvoiceHub</h2>
        <nav>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="content-area">
        <header className="topbar">
          <span>Dashboard</span>
          <button className="ghost-btn" type="button" onClick={onLogout}>
            Log out
          </button>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
