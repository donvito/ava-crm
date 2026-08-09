"use client";

import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckSquare,
  ChevronRight,
  CircleCheck,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  Mail,
  MapPin,
  Menu,
  Pencil,
  Phone,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { crmApi } from "./api.js";

const CONTACT_STATUSES = ["All", "Lead", "Prospect", "Customer", "Partner"];
const PIPELINE_STAGES = ["Qualified", "Proposal", "Negotiation", "Won"];

const viewToRoute = {
  overview: "/",
  contacts: "/contacts",
  pipeline: "/pipeline",
};

const stageMeta = {
  Qualified: { label: "Qualified", tone: "sage", probability: 35 },
  Proposal: { label: "Proposal sent", tone: "amber", probability: 60 },
  Negotiation: { label: "Negotiation", tone: "violet", probability: 80 },
  Won: { label: "Closed won", tone: "green", probability: 100 },
};

const statusTone = {
  Lead: "amber",
  Prospect: "violet",
  Customer: "green",
  Partner: "blue",
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactMoney = {
  format(value) {
    const absolute = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (absolute >= 1_000_000) {
      return `${sign}$${Number((absolute / 1_000_000).toFixed(1))}M`;
    }
    if (absolute >= 1_000) {
      return `${sign}$${Number((absolute / 1_000).toFixed(1))}K`;
    }
    return `${sign}$${Math.round(absolute)}`;
  },
};

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function avatarTone(id = 0) {
  return ["plum", "olive", "terracotta", "navy", "ochre"][id % 5];
}

function parseDate(value) {
  if (!value) return null;
  if (value.includes("T") || value.endsWith("Z")) return new Date(value);
  return new Date(`${value.replace(" ", "T")}Z`);
}

function relativeDate(value) {
  const date = parseDate(value);
  if (!date || Number.isNaN(date.getTime())) return "No activity yet";

  const days = Math.round((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  return `${Math.floor(days / 7)} weeks ago`;
}

function dueDate(value) {
  const date = parseDate(value);
  if (!date || Number.isNaN(date.getTime())) return "No due date";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  const dayDifference = Math.round((due - today) / 86_400_000);

  if (dayDifference < 0) return "Overdue";
  if (dayDifference === 0) return "Today";
  if (dayDifference === 1) return "Tomorrow";
  return due.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatCloseDate(value) {
  const date = parseDate(value);
  if (!date || Number.isNaN(date.getTime())) return "No close date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function App({ initialView = "overview" }) {
  const router = useRouter();
  const [view, setView] = useState(initialView);
  const [dashboard, setDashboard] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [contactModal, setContactModal] = useState(null);
  const [dealModal, setDealModal] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [toast, setToast] = useState(null);

  const loadAll = useCallback(async () => {
    setLoadError("");
    try {
      const [dashboardPayload, contactsPayload, dealsPayload] =
        await Promise.all([
          crmApi.dashboard(),
          crmApi.contacts(),
          crmApi.deals(),
        ]);
      setDashboard(dashboardPayload);
      setContacts(contactsPayload.contacts);
      setDeals(dealsPayload.deals);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function navigate(nextView) {
    setView(nextView);
    setMobileNavOpen(false);
    const nextRoute = viewToRoute[nextView];
    if (window.location.pathname !== nextRoute) {
      router.push(nextRoute);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function refreshDashboard() {
    const payload = await crmApi.dashboard();
    setDashboard(payload);
  }

  async function handleContactSaved(contact, isEditing) {
    const payload = isEditing
      ? await crmApi.updateContact(contact.id, contact)
      : await crmApi.createContact(contact);

    const contactsPayload = await crmApi.contacts();
    setContacts(contactsPayload.contacts);
    await refreshDashboard();
    setContactModal(null);
    setSelectedContact((current) =>
      current?.id === payload.contact.id ? payload.contact : current,
    );
    setToast({
      title: isEditing ? "Contact updated" : "Contact added",
      message: `${payload.contact.name} is saved to your workspace.`,
    });
  }

  async function handleDeleteContact(contact) {
    await crmApi.deleteContact(contact.id);
    setContacts((current) => current.filter((item) => item.id !== contact.id));
    setDeals((current) =>
      current.map((deal) =>
        deal.contactId === contact.id
          ? { ...deal, contactId: null, contactName: null }
          : deal,
      ),
    );
    await refreshDashboard();
    setSelectedContact(null);
    setToast({
      title: "Contact removed",
      message: `${contact.name} was removed from your workspace.`,
    });
  }

  async function handleDealSaved(deal, isEditing) {
    const payload = isEditing
      ? await crmApi.updateDeal(deal.id, deal)
      : await crmApi.createDeal(deal);
    const dealsPayload = await crmApi.deals();
    setDeals(dealsPayload.deals);
    await refreshDashboard();
    setDealModal(null);
    setToast({
      title: isEditing ? "Deal updated" : "Deal created",
      message: `${payload.deal.name} is now in ${payload.deal.stage}.`,
    });
  }

  async function handleDeleteDeal(deal) {
    await crmApi.deleteDeal(deal.id);
    setDeals((current) => current.filter((item) => item.id !== deal.id));
    await refreshDashboard();
    setDealModal(null);
    setToast({
      title: "Deal removed",
      message: `${deal.name} was removed from the pipeline.`,
    });
  }

  async function handleStageChange(deal, stage) {
    const previousDeals = deals;
    setDeals((current) =>
      current.map((item) => (item.id === deal.id ? { ...item, stage } : item)),
    );
    try {
      const payload = await crmApi.updateDeal(deal.id, { stage });
      setDeals((current) =>
        current.map((item) =>
          item.id === payload.deal.id ? payload.deal : item,
        ),
      );
      await refreshDashboard();
      setToast({
        title: stage === "Won" ? "Deal won" : "Stage updated",
        message: `${deal.name} moved to ${stage}.`,
      });
    } catch (error) {
      setDeals(previousDeals);
      setToast({ title: "Couldn’t move deal", message: error.message, error: true });
    }
  }

  async function handleTaskCompleted(task) {
    try {
      await crmApi.completeTask(task.id, true);
      await refreshDashboard();
      setToast({
        title: "Task complete",
        message: task.title,
      });
    } catch (error) {
      setToast({ title: "Couldn’t update task", message: error.message, error: true });
    }
  }

  function openContact(contact) {
    const current =
      contacts.find((candidate) => candidate.id === contact.id) ?? contact;
    setSelectedContact(current);
  }

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        onNavigate={navigate}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <main className="main-content">
        <MobileHeader
          onMenu={() => setMobileNavOpen(true)}
          onAdd={() => setContactModal({ mode: "create" })}
        />

        {loadError ? (
          <LoadError message={loadError} onRetry={loadAll} />
        ) : (
          <>
            {view === "overview" && (
              <Overview
                dashboard={dashboard}
                loading={loading}
                onAddContact={() => setContactModal({ mode: "create" })}
                onOpenContact={openContact}
                onNavigate={navigate}
                onCompleteTask={handleTaskCompleted}
              />
            )}
            {view === "contacts" && (
              <Contacts
                contacts={contacts}
                loading={loading}
                onAdd={() => setContactModal({ mode: "create" })}
                onOpen={openContact}
              />
            )}
            {view === "pipeline" && (
              <Pipeline
                deals={deals}
                contacts={contacts}
                loading={loading}
                onAdd={(stage = "Qualified") =>
                  setDealModal({ mode: "create", stage })
                }
                onEdit={(deal) => setDealModal({ mode: "edit", deal })}
                onStageChange={handleStageChange}
              />
            )}
          </>
        )}
      </main>

      {selectedContact && (
        <ContactDrawer
          contact={selectedContact}
          deals={deals.filter((deal) => deal.contactId === selectedContact.id)}
          onClose={() => setSelectedContact(null)}
          onEdit={() =>
            setContactModal({ mode: "edit", contact: selectedContact })
          }
          onDelete={handleDeleteContact}
          onOpenDeal={(deal) => setDealModal({ mode: "edit", deal })}
        />
      )}

      {contactModal && (
        <ContactFormModal
          contact={contactModal.contact}
          onClose={() => setContactModal(null)}
          onSave={handleContactSaved}
        />
      )}

      {dealModal && (
        <DealFormModal
          deal={dealModal.deal}
          initialStage={dealModal.stage}
          contacts={contacts}
          onClose={() => setDealModal(null)}
          onSave={handleDealSaved}
          onDelete={handleDeleteDeal}
        />
      )}

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function Sidebar({ view, onNavigate, open, onClose }) {
  const navigation = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "pipeline", label: "Pipeline", icon: BriefcaseBusiness },
  ];

  return (
    <>
      {open && (
        <button
          className="nav-scrim"
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span>folio</span>
        </div>

        <nav className="primary-nav" aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={viewToRoute[item.id]}
                className={view === item.id ? "active" : ""}
                aria-current={view === item.id ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate(item.id);
                }}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-tip">
          <div className="tip-icon">
            <Sparkles size={17} />
          </div>
          <strong>Stay in the loop</strong>
          <p>Keep every follow-up moving with focused daily tasks.</p>
          <button type="button" onClick={() => onNavigate("overview")}>
            View today
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="profile">
          <div className="avatar avatar-olive">MS</div>
          <div>
            <strong>Morgan Shaw</strong>
            <span>Workspace owner</span>
          </div>
          <ChevronRight size={16} />
        </div>
      </aside>
    </>
  );
}

function MobileHeader({ onMenu, onAdd }) {
  return (
    <div className="mobile-header">
      <button
        className="icon-button"
        type="button"
        aria-label="Open navigation"
        onClick={onMenu}
      >
        <Menu size={21} />
      </button>
      <div className="mobile-brand">
        <span className="brand-mark" aria-hidden="true">
          <span />
          <span />
        </span>
        folio
      </div>
      <button
        className="icon-button"
        type="button"
        aria-label="Add contact"
        onClick={onAdd}
      >
        <Plus size={21} />
      </button>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      <div className="header-actions">{children}</div>
    </header>
  );
}

function Overview({
  dashboard,
  loading,
  onAddContact,
  onOpenContact,
  onNavigate,
  onCompleteTask,
}) {
  if (loading || !dashboard) return <OverviewSkeleton />;

  const { metrics, pipeline, tasks, activities, recentContacts } = dashboard;
  const pipelineByStage = Object.fromEntries(
    pipeline.map((item) => [item.stage, item]),
  );
  const openPipeline = PIPELINE_STAGES.filter((stage) => stage !== "Won").reduce(
    (sum, stage) => sum + (pipelineByStage[stage]?.value ?? 0),
    0,
  );

  const metricCards = [
    {
      label: "Active contacts",
      value: metrics.contactCount.toLocaleString(),
      detail: `${metrics.customerCount} customers`,
      trend: "+8.6%",
      icon: Users,
      tone: "sage",
    },
    {
      label: "Open pipeline",
      value: compactMoney.format(metrics.pipelineValue),
      detail: `${compactMoney.format(metrics.weightedValue)} weighted`,
      trend: "+12.4%",
      icon: CircleDollarSign,
      tone: "amber",
    },
    {
      label: "Win rate",
      value: `${metrics.winRate}%`,
      detail: "Closed opportunities",
      trend: "+4.2%",
      icon: Target,
      tone: "violet",
    },
    {
      label: "Open tasks",
      value: metrics.openTasks.toLocaleString(),
      detail: tasks.length ? `${dueDate(tasks[0].dueAt)} next` : "All caught up",
      trend: "Today",
      icon: CheckSquare,
      tone: "blue",
    },
  ];

  return (
    <div className="page overview-page">
      <PageHeader
        eyebrow="Sunday, August 9"
        title="Good evening, Morgan"
        description="Here’s the pulse of your relationships and pipeline."
      >
        <button className="primary-button" type="button" onClick={onAddContact}>
          <Plus size={17} />
          Add contact
        </button>
      </PageHeader>

      <section className="metric-grid" aria-label="CRM summary">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="metric-card" key={card.label}>
              <div className={`metric-icon tone-${card.tone}`}>
                <Icon size={19} strokeWidth={1.8} />
              </div>
              <div className="metric-topline">
                <span>{card.label}</span>
                <span className="metric-trend">
                  {card.trend !== "Today" && <ArrowUpRight size={12} />}
                  {card.trend}
                </span>
              </div>
              <strong className="metric-value">{card.value}</strong>
              <span className="metric-detail">{card.detail}</span>
            </article>
          );
        })}
      </section>

      <section className="dashboard-grid">
        <article className="panel pipeline-overview">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Sales momentum</p>
              <h2>Pipeline overview</h2>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => onNavigate("pipeline")}
            >
              View pipeline
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="pipeline-total">
            <div>
              <span>Open opportunity value</span>
              <strong>{compactMoney.format(openPipeline)}</strong>
            </div>
            <span className="healthy-badge">
              <TrendingUp size={14} />
              Healthy
            </span>
          </div>

          <div className="pipeline-bar" aria-label="Pipeline value by stage">
            {PIPELINE_STAGES.filter((stage) => stage !== "Won").map((stage) => {
              const stageValue = pipelineByStage[stage]?.value ?? 0;
              return (
                <span
                  key={stage}
                  className={`pipeline-segment stage-${stage.toLowerCase()}`}
                  style={{
                    width: `${openPipeline ? (stageValue / openPipeline) * 100 : 0}%`,
                  }}
                  title={`${stage}: ${money.format(stageValue)}`}
                />
              );
            })}
          </div>

          <div className="pipeline-legend">
            {PIPELINE_STAGES.map((stage) => {
              const item = pipelineByStage[stage] ?? { count: 0, value: 0 };
              return (
                <button
                  type="button"
                  key={stage}
                  onClick={() => onNavigate("pipeline")}
                >
                  <span
                    className={`legend-dot stage-${stage.toLowerCase()}`}
                  />
                  <span>
                    <small>{stage}</small>
                    <strong>{compactMoney.format(item.value)}</strong>
                    <em>{item.count} deals</em>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="forecast-card">
            <div className="forecast-mark">
              <Sparkles size={18} />
            </div>
            <div>
              <strong>{compactMoney.format(metrics.weightedValue)} likely to close</strong>
              <p>Weighted by the probability on every open opportunity.</p>
            </div>
            <ChevronRight size={17} />
          </div>
        </article>

        <article className="panel tasks-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Focus list</p>
              <h2>Up next</h2>
            </div>
            <span className="count-badge">{tasks.length}</span>
          </div>

          {tasks.length ? (
            <div className="task-list">
              {tasks.map((task) => (
                <div className="task-item" key={task.id}>
                  <button
                    className="task-check"
                    type="button"
                    aria-label={`Complete ${task.title}`}
                    onClick={() => onCompleteTask(task)}
                  >
                    <Check size={13} />
                  </button>
                  <div className="task-copy">
                    <strong>{task.title}</strong>
                    <span>{task.company || task.contactName}</span>
                  </div>
                  <span
                    className={`due-label ${
                      dueDate(task.dueAt) === "Today" ? "due-today" : ""
                    }`}
                  >
                    {dueDate(task.dueAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CircleCheck}
              title="You’re all caught up"
              description="No open tasks are waiting for you."
            />
          )}

        </article>
      </section>

      <section className="dashboard-lower-grid">
        <article className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Your network</p>
              <h2>Recent contacts</h2>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => onNavigate("contacts")}
            >
              View all
              <ArrowRight size={15} />
            </button>
          </div>
          <div className="recent-list">
            {recentContacts.map((contact) => (
              <button
                type="button"
                className="recent-contact"
                key={contact.id}
                onClick={() => onOpenContact(contact)}
              >
                <Avatar contact={contact} />
                <span className="recent-contact-name">
                  <strong>{contact.name}</strong>
                  <small>{contact.title || contact.company}</small>
                </span>
                <span className="recent-company desktop-only">
                  {contact.company}
                </span>
                <StatusPill status={contact.status} />
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        </article>

        <article className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Live feed</p>
              <h2>Activity</h2>
            </div>
          </div>
          <div className="activity-list">
            {activities.slice(0, 4).map((activity, index) => (
              <div className="activity-item" key={activity.id}>
                <span className={`activity-dot activity-${activity.kind}`}>
                  {activity.kind === "deal_won" ? (
                    <CircleCheck size={13} />
                  ) : activity.kind === "contact_created" ? (
                    <UserPlus size={13} />
                  ) : (
                    <BriefcaseBusiness size={13} />
                  )}
                </span>
                {index < activities.slice(0, 4).length - 1 && (
                  <span className="activity-line" />
                )}
                <div>
                  <strong>{activity.description}</strong>
                  <span>
                    {activity.contactName ? `${activity.contactName} · ` : ""}
                    {relativeDate(activity.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function Contacts({ contacts, loading, onAdd, onOpen }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const visibleContacts = useMemo(() => {
    const query = search.toLowerCase().trim();
    return contacts.filter((contact) => {
      const matchesStatus = status === "All" || contact.status === status;
      const matchesSearch =
        !query ||
        [
          contact.name,
          contact.email,
          contact.company,
          contact.title,
          contact.city,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [contacts, search, status]);

  return (
    <div className="page contacts-page">
      <PageHeader
        eyebrow="Relationship book"
        title="Contacts"
        description={`${contacts.length} people across your customers, prospects, and partners.`}
      >
        <button className="primary-button" type="button" onClick={onAdd}>
          <Plus size={17} />
          Add contact
        </button>
      </PageHeader>

      <div className="contacts-toolbar">
        <label className="search-field">
          <Search size={18} />
          <span className="sr-only">Search contacts</span>
          <input
            type="search"
            placeholder="Search name, company, or email…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch("")}
            >
              <X size={15} />
            </button>
          )}
        </label>

        <div className="filter-tabs" aria-label="Filter contacts by relationship">
          {CONTACT_STATUSES.map((item) => (
            <button
              type="button"
              key={item}
              className={status === item ? "active" : ""}
              aria-pressed={status === item}
              onClick={() => setStatus(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <section className="contacts-table-panel" aria-label="Contacts">
        {loading ? (
          <TableSkeleton />
        ) : visibleContacts.length ? (
          <>
            <div className="contacts-table-head" aria-hidden="true">
              <span>Contact</span>
              <span>Company</span>
              <span>Relationship</span>
              <span>Last contact</span>
              <span />
            </div>
            <div className="contacts-table-body">
              {visibleContacts.map((contact) => (
                <button
                  type="button"
                  className="contact-row"
                  key={contact.id}
                  onClick={() => onOpen(contact)}
                >
                  <span className="contact-identity">
                    <Avatar contact={contact} />
                    <span>
                      <strong>{contact.name}</strong>
                      <small>{contact.email}</small>
                    </span>
                  </span>
                  <span className="company-cell">
                    <span className="company-mark">
                      {contact.company.slice(0, 1)}
                    </span>
                    <span>
                      <strong>{contact.company}</strong>
                      <small>{contact.title || "—"}</small>
                    </span>
                  </span>
                  <span>
                    <StatusPill status={contact.status} />
                  </span>
                  <span className="last-contact">
                    <Clock3 size={14} />
                    {relativeDate(contact.lastContactedAt)}
                  </span>
                  <span className="row-arrow">
                    <ChevronRight size={17} />
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={Search}
            title="No contacts found"
            description="Try a different name, company, or relationship filter."
          />
        )}
      </section>

      <p className="results-count">
        Showing {visibleContacts.length} of {contacts.length} contacts
      </p>
    </div>
  );
}

function Pipeline({
  deals,
  contacts,
  loading,
  onAdd,
  onEdit,
  onStageChange,
}) {
  const openDeals = deals.filter(
    (deal) => !["Won", "Lost"].includes(deal.stage),
  );
  const openValue = openDeals.reduce((sum, deal) => sum + deal.value, 0);
  const weightedValue = openDeals.reduce(
    (sum, deal) => sum + deal.value * (deal.probability / 100),
    0,
  );

  return (
    <div className="page pipeline-page">
      <PageHeader
        eyebrow="Revenue workspace"
        title="Deal pipeline"
        description={`${openDeals.length} open opportunities worth ${compactMoney.format(openValue)}.`}
      >
        <button
          className="primary-button"
          type="button"
          onClick={() => onAdd("Qualified")}
        >
          <Plus size={17} />
          New deal
        </button>
      </PageHeader>

      <section className="pipeline-summary" aria-label="Pipeline summary">
        <div>
          <span>Open pipeline</span>
          <strong>{compactMoney.format(openValue)}</strong>
        </div>
        <div>
          <span>Weighted forecast</span>
          <strong>{compactMoney.format(weightedValue)}</strong>
        </div>
        <div>
          <span>Active opportunities</span>
          <strong>{openDeals.length}</strong>
        </div>
        <div className="pipeline-insight">
          <span className="insight-icon">
            <TrendingUp size={16} />
          </span>
          <span>
            <strong>Pipeline is healthy</strong>
            <small>Negotiations are moving this week</small>
          </span>
        </div>
      </section>

      {loading ? (
        <BoardSkeleton />
      ) : (
        <section className="deal-board" aria-label="Deal stages">
          {PIPELINE_STAGES.map((stage) => {
            const stageDeals = deals.filter((deal) => deal.stage === stage);
            const stageValue = stageDeals.reduce(
              (sum, deal) => sum + deal.value,
              0,
            );
            return (
              <div className="deal-column" key={stage}>
                <div className="deal-column-header">
                  <div>
                    <span className={`stage-indicator stage-${stage.toLowerCase()}`} />
                    <strong>{stageMeta[stage].label}</strong>
                    <span className="column-count">{stageDeals.length}</span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Add deal to ${stage}`}
                    onClick={() => onAdd(stage)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="column-value">{compactMoney.format(stageValue)}</p>

                <div className="deal-column-body">
                  {stageDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onEdit={onEdit}
                      onStageChange={onStageChange}
                    />
                  ))}

                  {!stageDeals.length && (
                    <button
                      type="button"
                      className="empty-column"
                      onClick={() => onAdd(stage)}
                    >
                      <Plus size={16} />
                      Add an opportunity
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      <p className="board-help">
        <Sparkles size={14} />
        Tip: use the stage menu on any deal to keep your forecast current.
        {contacts.length === 0 && " Add a contact before connecting an opportunity."}
      </p>
    </div>
  );
}

function DealCard({ deal, onEdit, onStageChange }) {
  const [moving, setMoving] = useState(false);

  async function changeStage(event) {
    event.stopPropagation();
    setMoving(true);
    await onStageChange(deal, event.target.value);
    setMoving(false);
  }

  return (
    <article
      className={`deal-card ${moving ? "is-moving" : ""}`}
      onClick={() => onEdit(deal)}
    >
      <button
        type="button"
        className="deal-card-main"
        onClick={() => onEdit(deal)}
      >
        <span className="deal-company">
          <span className="company-mark">{deal.company.slice(0, 1)}</span>
          {deal.company}
        </span>
        <strong>{deal.name}</strong>
        <span className="deal-contact">
          {deal.contactName || "No contact linked"}
        </span>
        <span className="deal-value">{money.format(deal.value)}</span>
        <span className="probability-track">
          <span style={{ width: `${deal.probability}%` }} />
        </span>
        <span className="deal-meta">
          <span>
            <Target size={13} />
            {deal.probability}%
          </span>
          <span>
            <CalendarDays size={13} />
            {formatCloseDate(deal.closeDate)}
          </span>
        </span>
      </button>
      <div className="deal-card-footer">
        <label>
          <span className="sr-only">Move {deal.name} to stage</span>
          <select
            aria-label={`Move ${deal.name} to stage`}
            value={deal.stage}
            disabled={moving}
            onClick={(event) => event.stopPropagation()}
            onChange={changeStage}
          >
            {PIPELINE_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          aria-label={`Edit ${deal.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onEdit(deal);
          }}
        >
          <Pencil size={14} />
        </button>
      </div>
    </article>
  );
}

function ContactDrawer({
  contact,
  deals,
  onClose,
  onEdit,
  onDelete,
  onOpenDeal,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function removeContact() {
    setDeleting(true);
    try {
      await onDelete(contact);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="drawer-layer" role="presentation" onMouseDown={onClose}>
      <aside
        className="contact-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="drawer-topbar">
          <span>Contact details</span>
          <button
            className="icon-button"
            type="button"
            aria-label="Close contact details"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>

        <div className="contact-hero">
          <Avatar contact={contact} large />
          <h2 id="contact-drawer-title">{contact.name}</h2>
          <p>{contact.title || "Contact"} at {contact.company}</p>
          <StatusPill status={contact.status} />
        </div>

        <div className="drawer-actions">
          <a href={`mailto:${contact.email}`}>
            <Mail size={16} />
            Email
          </a>
          {contact.phone && (
            <a href={`tel:${contact.phone}`}>
              <Phone size={16} />
              Call
            </a>
          )}
          <button type="button" onClick={onEdit}>
            <Pencil size={16} />
            Edit
          </button>
        </div>

        <section className="drawer-section">
          <h3>Contact information</h3>
          <dl className="contact-details">
            <div>
              <dt>
                <Mail size={15} />
                Email
              </dt>
              <dd>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </dd>
            </div>
            <div>
              <dt>
                <Phone size={15} />
                Phone
              </dt>
              <dd>{contact.phone || "Not added"}</dd>
            </div>
            <div>
              <dt>
                <Building2 size={15} />
                Company
              </dt>
              <dd>{contact.company}</dd>
            </div>
            <div>
              <dt>
                <MapPin size={15} />
                Location
              </dt>
              <dd>{contact.city || "Not added"}</dd>
            </div>
          </dl>
        </section>

        <section className="drawer-section">
          <div className="section-title-row">
            <h3>Opportunities</h3>
            <span>{deals.length}</span>
          </div>
          {deals.length ? (
            <div className="contact-deals">
              {deals.map((deal) => (
                <button type="button" key={deal.id} onClick={() => onOpenDeal(deal)}>
                  <span>
                    <strong>{deal.name}</strong>
                    <small>{deal.stage}</small>
                  </span>
                  <span>{compactMoney.format(deal.value)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="muted-copy">No opportunities are linked yet.</p>
          )}
        </section>

        {contact.notes && (
          <section className="drawer-section">
            <h3>Notes</h3>
            <p className="notes-copy">{contact.notes}</p>
          </section>
        )}

        <div className="drawer-footer">
          {confirmDelete ? (
            <div className="delete-confirmation">
              <span>Remove {contact.firstName}?</span>
              <button
                type="button"
                className="danger-button"
                disabled={deleting}
                onClick={removeContact}
              >
                {deleting ? "Removing…" : "Yes, remove"}
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="delete-link"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={15} />
              Remove contact
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

function ContactFormModal({ contact, onClose, onSave }) {
  const isEditing = Boolean(contact);
  const [form, setForm] = useState({
    firstName: contact?.firstName ?? "",
    lastName: contact?.lastName ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    company: contact?.company ?? "",
    title: contact?.title ?? "",
    status: contact?.status ?? "Lead",
    source: contact?.source ?? "Website",
    city: contact?.city ?? "",
    notes: contact?.notes ?? "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await onSave(
        isEditing ? { ...form, id: contact.id } : form,
        isEditing,
      );
    } catch (error) {
      setErrors(error.errors ?? {});
      setFormError(error.message);
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEditing ? "Edit contact" : "Add a new contact"}
      subtitle={
        isEditing
          ? "Keep relationship details accurate and useful."
          : "Create a complete relationship record for your team."
      }
      onClose={onClose}
    >
      <form className="entity-form" onSubmit={submit} noValidate>
        {formError && <div className="form-banner">{formError}</div>}

        <div className="form-grid">
          <Field label="First name" error={errors.firstName} required>
            <input
              autoFocus
              name="firstName"
              value={form.firstName}
              aria-invalid={Boolean(errors.firstName)}
              onChange={(event) => update("firstName", event.target.value)}
            />
          </Field>
          <Field label="Last name" error={errors.lastName} required>
            <input
              name="lastName"
              value={form.lastName}
              aria-invalid={Boolean(errors.lastName)}
              onChange={(event) => update("lastName", event.target.value)}
            />
          </Field>
          <Field
            label="Work email"
            error={errors.email}
            required
            wide
          >
            <input
              type="email"
              name="email"
              placeholder="name@company.com"
              value={form.email}
              aria-invalid={Boolean(errors.email)}
              onChange={(event) => update("email", event.target.value)}
            />
          </Field>
          <Field label="Company" error={errors.company} required>
            <input
              name="company"
              value={form.company}
              aria-invalid={Boolean(errors.company)}
              onChange={(event) => update("company", event.target.value)}
            />
          </Field>
          <Field label="Role">
            <input
              name="title"
              placeholder="e.g. Operations lead"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
            />
          </Field>
          <Field label="City">
            <input
              name="city"
              value={form.city}
              onChange={(event) => update("city", event.target.value)}
            />
          </Field>
          <Field label="Relationship" error={errors.status}>
            <select
              name="status"
              value={form.status}
              onChange={(event) => update("status", event.target.value)}
            >
              {CONTACT_STATUSES.filter((item) => item !== "All").map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Source">
            <select
              name="source"
              value={form.source}
              onChange={(event) => update("source", event.target.value)}
            >
              {["Website", "Referral", "Event", "Outbound", "Partner"].map(
                (item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field label="Notes" wide>
            <textarea
              name="notes"
              rows="3"
              placeholder="Context, preferences, or next steps…"
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
            />
          </Field>
        </div>

        <div className="form-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving…" : isEditing ? "Save changes" : "Add contact"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DealFormModal({
  deal,
  initialStage = "Qualified",
  contacts,
  onClose,
  onSave,
  onDelete,
}) {
  const isEditing = Boolean(deal);
  const [form, setForm] = useState({
    name: deal?.name ?? "",
    contactId: deal?.contactId ?? "",
    company: deal?.company ?? "",
    value: deal?.value ?? "",
    stage: deal?.stage ?? initialStage,
    probability: deal?.probability ?? stageMeta[initialStage]?.probability ?? 35,
    closeDate:
      deal?.closeDate ??
      new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function chooseContact(value) {
    const contact = contacts.find((item) => item.id === Number(value));
    setForm((current) => ({
      ...current,
      contactId: value,
      company: contact?.company ?? current.company,
    }));
  }

  function chooseStage(value) {
    setForm((current) => ({
      ...current,
      stage: value,
      probability: stageMeta[value]?.probability ?? current.probability,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await onSave(isEditing ? { ...form, id: deal.id } : form, isEditing);
    } catch (error) {
      setErrors(error.errors ?? {});
      setFormError(error.message);
      setSaving(false);
    }
  }

  async function removeDeal() {
    setSaving(true);
    try {
      await onDelete(deal);
    } catch (error) {
      setFormError(error.message);
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEditing ? "Edit opportunity" : "Create an opportunity"}
      subtitle="Keep value, timing, and next stage visible to your team."
      onClose={onClose}
    >
      <form className="entity-form" onSubmit={submit} noValidate>
        {formError && <div className="form-banner">{formError}</div>}
        <div className="form-grid">
          <Field label="Deal name" error={errors.name} required wide>
            <input
              autoFocus
              name="name"
              placeholder="e.g. Annual workspace plan"
              value={form.name}
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => update("name", event.target.value)}
            />
          </Field>
          <Field label="Primary contact" error={errors.contactId}>
            <select
              name="contactId"
              value={form.contactId}
              onChange={(event) => chooseContact(event.target.value)}
            >
              <option value="">No contact</option>
              {contacts.map((contact) => (
                <option value={contact.id} key={contact.id}>
                  {contact.name} · {contact.company}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Company" error={errors.company} required>
            <input
              name="company"
              value={form.company}
              aria-invalid={Boolean(errors.company)}
              onChange={(event) => update("company", event.target.value)}
            />
          </Field>
          <Field label="Deal value" error={errors.value} required>
            <div className="money-input">
              <span>$</span>
              <input
                name="value"
                type="number"
                min="1"
                step="100"
                value={form.value}
                aria-invalid={Boolean(errors.value)}
                onChange={(event) => update("value", event.target.value)}
              />
            </div>
          </Field>
          <Field label="Expected close">
            <input
              name="closeDate"
              type="date"
              value={form.closeDate}
              onChange={(event) => update("closeDate", event.target.value)}
            />
          </Field>
          <Field label="Stage" error={errors.stage}>
            <select
              name="stage"
              value={form.stage}
              onChange={(event) => chooseStage(event.target.value)}
            >
              {PIPELINE_STAGES.map((stage) => (
                <option value={stage} key={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Probability · ${form.probability}%`}>
            <input
              className="range-input"
              name="probability"
              type="range"
              min="0"
              max="100"
              step="5"
              value={form.probability}
              onChange={(event) => update("probability", event.target.value)}
            />
          </Field>
        </div>

        <div className="form-actions form-actions-split">
          <div>
            {isEditing &&
              (confirmDelete ? (
                <>
                  <button
                    className="danger-button"
                    type="button"
                    disabled={saving}
                    onClick={removeDeal}
                  >
                    Confirm remove
                  </button>
                  <button
                    className="quiet-button"
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Keep it
                  </button>
                </>
              ) : (
                <button
                  className="delete-link"
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={15} />
                  Remove
                </button>
              ))}
          </div>
          <div>
            <button
              className="secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Saving…" : isEditing ? "Save changes" : "Create deal"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="modal-layer" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Field({ label, error, required, wide, children }) {
  return (
    <label className={`form-field ${wide ? "field-wide" : ""}`}>
      <span>
        {label}
        {required && <em>Required</em>}
      </span>
      {children}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

function Avatar({ contact, large = false }) {
  return (
    <span
      className={`avatar avatar-${avatarTone(contact.id)} ${large ? "avatar-large" : ""}`}
      aria-hidden="true"
    >
      {initials(contact.name)}
    </span>
  );
}

function StatusPill({ status }) {
  return (
    <span className={`status-pill status-${statusTone[status] ?? "sage"}`}>
      <span />
      {status}
    </span>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty-state">
      <span>
        <Icon size={20} />
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function LoadError({ message, onRetry }) {
  return (
    <div className="load-error">
      <span>
        <X size={22} />
      </span>
      <h1>We couldn’t open your workspace</h1>
      <p>{message}</p>
      <button className="primary-button" type="button" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

function Toast({ toast, onClose }) {
  return (
    <div
      className={`toast ${toast.error ? "toast-error" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="toast-icon">
        {toast.error ? <X size={16} /> : <Check size={16} />}
      </span>
      <span>
        <strong>{toast.title}</strong>
        <small>{toast.message}</small>
      </span>
      <button type="button" aria-label="Dismiss notification" onClick={onClose}>
        <X size={15} />
      </button>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="page">
      <div className="skeleton skeleton-title" />
      <div className="metric-grid">
        {[0, 1, 2, 3].map((item) => (
          <div className="metric-card skeleton-card" key={item}>
            <div className="skeleton skeleton-line short" />
            <div className="skeleton skeleton-value" />
            <div className="skeleton skeleton-line" />
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="panel skeleton-panel" />
        <div className="panel skeleton-panel" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="table-skeleton">
      {[0, 1, 2, 3, 4].map((item) => (
        <div key={item}>
          <span className="skeleton skeleton-avatar" />
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line" />
        </div>
      ))}
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="deal-board">
      {[0, 1, 2, 3].map((column) => (
        <div className="deal-column" key={column}>
          <div className="skeleton skeleton-line" />
          {[0, 1].map((card) => (
            <div className="skeleton board-skeleton-card" key={card} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;
