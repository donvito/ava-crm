import { NavLink, Route, Routes } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import { CompaniesPage } from "../../companies/frontend/CompaniesPage";
import { ContactsPage } from "../../contacts/frontend/ContactsPage";
import { DealsPage } from "../../deals/frontend/DealsPage";

export function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            Ava<span>.</span>
          </div>
          <p>Customer relationships, kept close.</p>
        </div>
        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/companies">Companies</NavLink>
          <NavLink to="/contacts">Contacts</NavLink>
          <NavLink to="/deals">Deals</NavLink>
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/deals" element={<DealsPage />} />
        </Routes>
      </main>
    </div>
  );
}
