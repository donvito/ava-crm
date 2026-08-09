import Database from "better-sqlite3";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

const CONTACT_STATUSES = ["Lead", "Prospect", "Customer", "Partner"];
const DEAL_STAGES = ["Qualified", "Proposal", "Negotiation", "Won", "Lost"];

const seedContacts = [
  {
    firstName: "Olivia",
    lastName: "Martin",
    email: "olivia@northstar.studio",
    phone: "+1 415 555 0142",
    company: "Northstar Studio",
    title: "Creative Director",
    status: "Customer",
    source: "Referral",
    city: "San Francisco",
    lastContactedDaysAgo: 1,
  },
  {
    firstName: "Marcus",
    lastName: "Chen",
    email: "marcus@fieldworklabs.com",
    phone: "+1 646 555 0199",
    company: "Fieldwork Labs",
    title: "Co-founder",
    status: "Prospect",
    source: "Website",
    city: "New York",
    lastContactedDaysAgo: 2,
  },
  {
    firstName: "Sofia",
    lastName: "Rodriguez",
    email: "sofia@lumoncoffee.co",
    phone: "+1 503 555 0117",
    company: "Lumon Coffee Co.",
    title: "Head of Operations",
    status: "Lead",
    source: "Event",
    city: "Portland",
    lastContactedDaysAgo: 4,
  },
  {
    firstName: "Theo",
    lastName: "Bennett",
    email: "theo@arcandloom.com",
    phone: "+44 20 7946 0321",
    company: "Arc & Loom",
    title: "Managing Partner",
    status: "Partner",
    source: "Partner",
    city: "London",
    lastContactedDaysAgo: 6,
  },
  {
    firstName: "Amara",
    lastName: "Okafor",
    email: "amara@cascadehealth.io",
    phone: "+1 206 555 0184",
    company: "Cascade Health",
    title: "VP of Growth",
    status: "Prospect",
    source: "Outbound",
    city: "Seattle",
    lastContactedDaysAgo: 8,
  },
  {
    firstName: "Jonas",
    lastName: "Berg",
    email: "jonas@commonform.design",
    phone: "+46 8 410 245 10",
    company: "Commonform",
    title: "Design Lead",
    status: "Customer",
    source: "Referral",
    city: "Stockholm",
    lastContactedDaysAgo: 10,
  },
  {
    firstName: "Maya",
    lastName: "Patel",
    email: "maya@kinshipfoods.com",
    phone: "+1 312 555 0138",
    company: "Kinship Foods",
    title: "Founder & CEO",
    status: "Lead",
    source: "Website",
    city: "Chicago",
    lastContactedDaysAgo: 13,
  },
  {
    firstName: "Elliot",
    lastName: "Reed",
    email: "elliot@altitudeworks.co",
    phone: "+1 720 555 0166",
    company: "Altitude Works",
    title: "Revenue Director",
    status: "Prospect",
    source: "Event",
    city: "Denver",
    lastContactedDaysAgo: 17,
  },
];

const seedDeals = [
  {
    name: "Brand systems rollout",
    contactEmail: "olivia@northstar.studio",
    company: "Northstar Studio",
    value: 48000,
    stage: "Proposal",
    probability: 60,
    closesInDays: 18,
  },
  {
    name: "Enterprise workspace",
    contactEmail: "marcus@fieldworklabs.com",
    company: "Fieldwork Labs",
    value: 72000,
    stage: "Negotiation",
    probability: 80,
    closesInDays: 9,
  },
  {
    name: "Retail expansion",
    contactEmail: "sofia@lumoncoffee.co",
    company: "Lumon Coffee Co.",
    value: 26000,
    stage: "Qualified",
    probability: 35,
    closesInDays: 31,
  },
  {
    name: "Partner enablement",
    contactEmail: "theo@arcandloom.com",
    company: "Arc & Loom",
    value: 34000,
    stage: "Proposal",
    probability: 55,
    closesInDays: 24,
  },
  {
    name: "Team onboarding",
    contactEmail: "amara@cascadehealth.io",
    company: "Cascade Health",
    value: 56000,
    stage: "Qualified",
    probability: 40,
    closesInDays: 36,
  },
  {
    name: "Design operations",
    contactEmail: "jonas@commonform.design",
    company: "Commonform",
    value: 42000,
    stage: "Won",
    probability: 100,
    closesInDays: -12,
  },
  {
    name: "Multi-site license",
    contactEmail: "maya@kinshipfoods.com",
    company: "Kinship Foods",
    value: 88000,
    stage: "Won",
    probability: 100,
    closesInDays: -22,
  },
  {
    name: "Growth analytics pilot",
    contactEmail: "elliot@altitudeworks.co",
    company: "Altitude Works",
    value: 18000,
    stage: "Lost",
    probability: 0,
    closesInDays: -18,
  },
];

function mapContact(row) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    name: `${row.first_name} ${row.last_name}`.trim(),
    email: row.email,
    phone: row.phone,
    company: row.company,
    title: row.title,
    status: row.status,
    source: row.source,
    city: row.city,
    notes: row.notes,
    lastContactedAt: row.last_contacted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDeal(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    contactId: row.contact_id,
    contactName: row.contact_name ?? null,
    company: row.company,
    value: row.value,
    stage: row.stage,
    probability: row.probability,
    closeDate: row.close_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatDateOffset(days) {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function initializeSchema(db) {
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Lead',
      source TEXT NOT NULL DEFAULT 'Website',
      city TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      last_contacted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
      company TEXT NOT NULL,
      value INTEGER NOT NULL CHECK(value >= 0),
      stage TEXT NOT NULL DEFAULT 'Qualified',
      probability INTEGER NOT NULL DEFAULT 25 CHECK(probability BETWEEN 0 AND 100),
      close_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
      due_at TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal',
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      description TEXT NOT NULL,
      contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
      deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS contacts_company_idx ON contacts(company);
    CREATE INDEX IF NOT EXISTS contacts_status_idx ON contacts(status);
    CREATE INDEX IF NOT EXISTS deals_stage_idx ON deals(stage);
    CREATE INDEX IF NOT EXISTS activities_created_idx ON activities(created_at DESC);
  `);
}

function seedDatabase(db) {
  const row = db.prepare("SELECT COUNT(*) AS count FROM contacts").get();
  if (row.count > 0) return;

  const insertContact = db.prepare(`
    INSERT INTO contacts (
      first_name, last_name, email, phone, company, title, status, source, city,
      last_contacted_at, created_at, updated_at
    ) VALUES (
      @firstName, @lastName, @email, @phone, @company, @title, @status, @source,
      @city, @lastContactedAt, @createdAt, @createdAt
    )
  `);

  const insertDeal = db.prepare(`
    INSERT INTO deals (
      name, contact_id, company, value, stage, probability, close_date, created_at, updated_at
    ) VALUES (
      @name, @contactId, @company, @value, @stage, @probability, @closeDate,
      @createdAt, @createdAt
    )
  `);

  const insertTask = db.prepare(`
    INSERT INTO tasks (title, contact_id, due_at, priority)
    VALUES (@title, @contactId, @dueAt, @priority)
  `);

  const insertActivity = db.prepare(`
    INSERT INTO activities (kind, description, contact_id, deal_id, created_at)
    VALUES (@kind, @description, @contactId, @dealId, @createdAt)
  `);

  const seed = db.transaction(() => {
    const contactIds = new Map();

    seedContacts.forEach((contact, index) => {
      const createdAt = formatDateOffset(-(index * 7 + 2));
      const result = insertContact.run({
        ...contact,
        lastContactedAt: formatDateOffset(-contact.lastContactedDaysAgo),
        createdAt,
      });
      contactIds.set(contact.email, Number(result.lastInsertRowid));
    });

    seedDeals.forEach((deal, index) => {
      const result = insertDeal.run({
        ...deal,
        contactId: contactIds.get(deal.contactEmail),
        closeDate: formatDateOffset(deal.closesInDays).slice(0, 10),
        createdAt: formatDateOffset(-(index * 4 + 1)),
      });
      const dealId = Number(result.lastInsertRowid);
      insertActivity.run({
        kind: deal.stage === "Won" ? "deal_won" : "deal_updated",
        description:
          deal.stage === "Won"
            ? `Won ${deal.name}`
            : `Moved ${deal.name} to ${deal.stage}`,
        contactId: contactIds.get(deal.contactEmail),
        dealId,
        createdAt: formatDateOffset(-(index % 5)),
      });
    });

    [
      {
        title: "Send proposal follow-up",
        email: "olivia@northstar.studio",
        dueInDays: 0,
        priority: "high",
      },
      {
        title: "Prepare pricing options",
        email: "marcus@fieldworklabs.com",
        dueInDays: 1,
        priority: "high",
      },
      {
        title: "Book discovery call",
        email: "sofia@lumoncoffee.co",
        dueInDays: 2,
        priority: "normal",
      },
      {
        title: "Share onboarding timeline",
        email: "amara@cascadehealth.io",
        dueInDays: 4,
        priority: "normal",
      },
    ].forEach((task) => {
      insertTask.run({
        title: task.title,
        contactId: contactIds.get(task.email),
        dueAt: formatDateOffset(task.dueInDays),
        priority: task.priority,
      });
    });
  });

  seed();
}

export function createCrmStore(options = {}) {
  const databasePath =
    options.databasePath ??
    process.env.CRM_DB_PATH ??
    resolve(process.cwd(), "data", "crm.sqlite");
  const reset = options.reset ?? process.env.CRM_RESET_DB === "true";

  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true });
    if (reset) {
      rmSync(databasePath, { force: true });
      rmSync(`${databasePath}-shm`, { force: true });
      rmSync(`${databasePath}-wal`, { force: true });
    }
  }

  const db = new Database(databasePath);
  initializeSchema(db);

  if (options.seed !== false) {
    seedDatabase(db);
  }

  const contactSelect = `
    SELECT id, first_name, last_name, email, phone, company, title, status,
      source, city, notes, last_contacted_at, created_at, updated_at
    FROM contacts
  `;

  const dealSelect = `
    SELECT d.id, d.name, d.contact_id, d.company, d.value, d.stage,
      d.probability, d.close_date, d.created_at, d.updated_at,
      TRIM(COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')) AS contact_name
    FROM deals d
    LEFT JOIN contacts c ON c.id = d.contact_id
  `;

  return {
    databasePath,

    close() {
      db.close();
    },

    listContacts({ search = "", status = "All" } = {}) {
      const filters = [];
      const params = {};

      if (search.trim()) {
        filters.push(`(
          first_name LIKE @search OR last_name LIKE @search OR email LIKE @search
          OR company LIKE @search OR title LIKE @search
        )`);
        params.search = `%${search.trim()}%`;
      }

      if (status !== "All") {
        filters.push("status = @status");
        params.status = status;
      }

      const where = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
      return db
        .prepare(`${contactSelect}${where} ORDER BY updated_at DESC, id DESC`)
        .all(params)
        .map(mapContact);
    },

    getContact(id) {
      return mapContact(db.prepare(`${contactSelect} WHERE id = ?`).get(id));
    },

    createContact(contact) {
      const result = db
        .prepare(`
          INSERT INTO contacts (
            first_name, last_name, email, phone, company, title, status, source,
            city, notes, last_contacted_at
          ) VALUES (
            @firstName, @lastName, @email, @phone, @company, @title, @status,
            @source, @city, @notes, datetime('now')
          )
        `)
        .run(contact);

      const id = Number(result.lastInsertRowid);
      db.prepare(`
        INSERT INTO activities (kind, description, contact_id)
        VALUES ('contact_created', @description, @contactId)
      `).run({
        description: `Added ${contact.firstName} ${contact.lastName}`,
        contactId: id,
      });

      return this.getContact(id);
    },

    updateContact(id, contact) {
      const existing = this.getContact(id);
      if (!existing) return null;

      const next = { ...existing, ...contact, id };
      db.prepare(`
        UPDATE contacts SET
          first_name = @firstName,
          last_name = @lastName,
          email = @email,
          phone = @phone,
          company = @company,
          title = @title,
          status = @status,
          source = @source,
          city = @city,
          notes = @notes,
          updated_at = datetime('now')
        WHERE id = @id
      `).run(next);

      return this.getContact(id);
    },

    deleteContact(id) {
      const result = db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
      return result.changes > 0;
    },

    listDeals({ stage } = {}) {
      const where = stage ? " WHERE d.stage = @stage" : "";
      return db
        .prepare(
          `${dealSelect}${where}
           ORDER BY
             CASE d.stage
               WHEN 'Qualified' THEN 1
               WHEN 'Proposal' THEN 2
               WHEN 'Negotiation' THEN 3
               WHEN 'Won' THEN 4
               ELSE 5
             END,
             d.updated_at DESC,
             d.id DESC`,
        )
        .all(stage ? { stage } : {})
        .map(mapDeal);
    },

    getDeal(id) {
      return mapDeal(db.prepare(`${dealSelect} WHERE d.id = ?`).get(id));
    },

    createDeal(deal) {
      const result = db
        .prepare(`
          INSERT INTO deals (
            name, contact_id, company, value, stage, probability, close_date
          ) VALUES (
            @name, @contactId, @company, @value, @stage, @probability, @closeDate
          )
        `)
        .run(deal);
      const id = Number(result.lastInsertRowid);

      db.prepare(`
        INSERT INTO activities (kind, description, contact_id, deal_id)
        VALUES ('deal_created', @description, @contactId, @dealId)
      `).run({
        description: `Created ${deal.name}`,
        contactId: deal.contactId,
        dealId: id,
      });

      return this.getDeal(id);
    },

    updateDeal(id, deal) {
      const existing = this.getDeal(id);
      if (!existing) return null;
      const next = { ...existing, ...deal, id };
      const stageChanged = existing.stage !== next.stage;

      db.prepare(`
        UPDATE deals SET
          name = @name,
          contact_id = @contactId,
          company = @company,
          value = @value,
          stage = @stage,
          probability = @probability,
          close_date = @closeDate,
          updated_at = datetime('now')
        WHERE id = @id
      `).run(next);

      if (stageChanged) {
        db.prepare(`
          INSERT INTO activities (kind, description, contact_id, deal_id)
          VALUES (@kind, @description, @contactId, @dealId)
        `).run({
          kind: next.stage === "Won" ? "deal_won" : "deal_updated",
          description:
            next.stage === "Won"
              ? `Won ${next.name}`
              : `Moved ${next.name} to ${next.stage}`,
          contactId: next.contactId,
          dealId: id,
        });
      }

      return this.getDeal(id);
    },

    deleteDeal(id) {
      const result = db.prepare("DELETE FROM deals WHERE id = ?").run(id);
      return result.changes > 0;
    },

    completeTask(id, completed) {
      const result = db
        .prepare("UPDATE tasks SET completed = @completed WHERE id = @id")
        .run({ id, completed: completed ? 1 : 0 });
      if (result.changes === 0) return null;
      return db
        .prepare(`
          SELECT t.*, TRIM(c.first_name || ' ' || c.last_name) AS contact_name
          FROM tasks t
          LEFT JOIN contacts c ON c.id = t.contact_id
          WHERE t.id = ?
        `)
        .get(id);
    },

    getDashboard() {
      const contactCount = db
        .prepare("SELECT COUNT(*) AS count FROM contacts")
        .get().count;
      const customerCount = db
        .prepare("SELECT COUNT(*) AS count FROM contacts WHERE status = 'Customer'")
        .get().count;
      const pipelineValue = db
        .prepare(`
          SELECT COALESCE(SUM(value), 0) AS value
          FROM deals
          WHERE stage NOT IN ('Won', 'Lost')
        `)
        .get().value;
      const weightedValue = db
        .prepare(`
          SELECT COALESCE(SUM(value * probability / 100), 0) AS value
          FROM deals
          WHERE stage NOT IN ('Won', 'Lost')
        `)
        .get().value;
      const outcomes = db
        .prepare(`
          SELECT
            SUM(CASE WHEN stage = 'Won' THEN 1 ELSE 0 END) AS won,
            SUM(CASE WHEN stage = 'Lost' THEN 1 ELSE 0 END) AS lost
          FROM deals
        `)
        .get();
      const winRate =
        outcomes.won + outcomes.lost > 0
          ? Math.round((outcomes.won / (outcomes.won + outcomes.lost)) * 100)
          : 0;
      const openTasks = db
        .prepare("SELECT COUNT(*) AS count FROM tasks WHERE completed = 0")
        .get().count;

      const pipeline = db
        .prepare(`
          SELECT stage, COUNT(*) AS count, COALESCE(SUM(value), 0) AS value
          FROM deals
          WHERE stage != 'Lost'
          GROUP BY stage
        `)
        .all();

      const tasks = db
        .prepare(`
          SELECT t.id, t.title, t.due_at, t.priority, t.completed,
            TRIM(c.first_name || ' ' || c.last_name) AS contact_name,
            c.company
          FROM tasks t
          LEFT JOIN contacts c ON c.id = t.contact_id
          WHERE t.completed = 0
          ORDER BY t.due_at ASC
          LIMIT 5
        `)
        .all()
        .map((task) => ({
          id: task.id,
          title: task.title,
          dueAt: task.due_at,
          priority: task.priority,
          completed: Boolean(task.completed),
          contactName: task.contact_name,
          company: task.company,
        }));

      const activities = db
        .prepare(`
          SELECT a.id, a.kind, a.description, a.created_at,
            TRIM(COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')) AS contact_name
          FROM activities a
          LEFT JOIN contacts c ON c.id = a.contact_id
          ORDER BY a.created_at DESC, a.id DESC
          LIMIT 6
        `)
        .all()
        .map((activity) => ({
          id: activity.id,
          kind: activity.kind,
          description: activity.description,
          contactName: activity.contact_name || null,
          createdAt: activity.created_at,
        }));

      const recentContacts = db
        .prepare(`${contactSelect} ORDER BY created_at DESC, id DESC LIMIT 5`)
        .all()
        .map(mapContact);

      return {
        metrics: {
          contactCount,
          customerCount,
          pipelineValue,
          weightedValue,
          winRate,
          openTasks,
        },
        pipeline,
        tasks,
        activities,
        recentContacts,
      };
    },
  };
}

export { CONTACT_STATUSES, DEAL_STAGES };
