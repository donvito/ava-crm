import { Inject, Injectable, OnApplicationShutdown } from "@nestjs/common";
import Database from "better-sqlite3";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  Activity,
  Contact,
  ContactInput,
  ContactStatus,
  CrmTask,
  Dashboard,
  Deal,
  DealInput,
  DealStage,
  PipelineSummary,
} from "../../../contracts";

export const CRM_DATABASE_OPTIONS = Symbol("CRM_DATABASE_OPTIONS");

export interface CrmDatabaseOptions {
  databasePath?: string;
  reset?: boolean;
  seed?: boolean;
}

interface ContactRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  status: ContactStatus;
  source: string;
  city: string;
  notes: string;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DealRow {
  id: number;
  name: string;
  contact_id: number | null;
  contact_name: string | null;
  company: string;
  value: number;
  stage: DealStage;
  probability: number;
  close_date: string | null;
  created_at: string;
  updated_at: string;
}

const seedContacts = [
  {
    firstName: "Olivia",
    lastName: "Martin",
    email: "olivia@northstar.studio",
    phone: "+1 415 555 0142",
    company: "Northstar Studio",
    title: "Creative Director",
    status: "Customer" as const,
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
    status: "Prospect" as const,
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
    status: "Lead" as const,
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
    status: "Partner" as const,
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
    status: "Prospect" as const,
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
    status: "Customer" as const,
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
    status: "Lead" as const,
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
    status: "Prospect" as const,
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
    stage: "Proposal" as const,
    probability: 60,
    closesInDays: 18,
  },
  {
    name: "Enterprise workspace",
    contactEmail: "marcus@fieldworklabs.com",
    company: "Fieldwork Labs",
    value: 72000,
    stage: "Negotiation" as const,
    probability: 80,
    closesInDays: 9,
  },
  {
    name: "Retail expansion",
    contactEmail: "sofia@lumoncoffee.co",
    company: "Lumon Coffee Co.",
    value: 26000,
    stage: "Qualified" as const,
    probability: 35,
    closesInDays: 31,
  },
  {
    name: "Partner enablement",
    contactEmail: "theo@arcandloom.com",
    company: "Arc & Loom",
    value: 34000,
    stage: "Proposal" as const,
    probability: 55,
    closesInDays: 24,
  },
  {
    name: "Team onboarding",
    contactEmail: "amara@cascadehealth.io",
    company: "Cascade Health",
    value: 56000,
    stage: "Qualified" as const,
    probability: 40,
    closesInDays: 36,
  },
  {
    name: "Design operations",
    contactEmail: "jonas@commonform.design",
    company: "Commonform",
    value: 42000,
    stage: "Won" as const,
    probability: 100,
    closesInDays: -12,
  },
  {
    name: "Multi-site license",
    contactEmail: "maya@kinshipfoods.com",
    company: "Kinship Foods",
    value: 88000,
    stage: "Won" as const,
    probability: 100,
    closesInDays: -22,
  },
  {
    name: "Growth analytics pilot",
    contactEmail: "elliot@altitudeworks.co",
    company: "Altitude Works",
    value: 18000,
    stage: "Lost" as const,
    probability: 0,
    closesInDays: -18,
  },
];

function mapContact(row: ContactRow | undefined): Contact | null {
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

function mapDeal(row: DealRow | undefined): Deal | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    contactId: row.contact_id,
    contactName: row.contact_name || null,
    company: row.company,
    value: row.value,
    stage: row.stage,
    probability: row.probability,
    closeDate: row.close_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatDateOffset(days: number): string {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

@Injectable()
export class CrmStore implements OnApplicationShutdown {
  readonly databasePath: string;
  private readonly db: Database.Database;
  private closed = false;

  private readonly contactSelect = `
    SELECT id, first_name, last_name, email, phone, company, title, status,
      source, city, notes, last_contacted_at, created_at, updated_at
    FROM contacts
  `;

  private readonly dealSelect = `
    SELECT d.id, d.name, d.contact_id, d.company, d.value, d.stage,
      d.probability, d.close_date, d.created_at, d.updated_at,
      TRIM(COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')) AS contact_name
    FROM deals d
    LEFT JOIN contacts c ON c.id = d.contact_id
  `;

  constructor(
    @Inject(CRM_DATABASE_OPTIONS)
    options: CrmDatabaseOptions = {},
  ) {
    this.databasePath =
      options.databasePath ??
      process.env.CRM_DB_PATH ??
      resolve(process.cwd(), "data", "crm.sqlite");
    const reset = options.reset ?? process.env.CRM_RESET_DB === "true";

    if (this.databasePath !== ":memory:") {
      mkdirSync(dirname(this.databasePath), { recursive: true });
      if (reset) {
        rmSync(this.databasePath, { force: true });
        rmSync(`${this.databasePath}-shm`, { force: true });
        rmSync(`${this.databasePath}-wal`, { force: true });
      }
    }

    this.db = new Database(this.databasePath);
    this.initializeSchema();
    if (options.seed !== false) this.seedDatabase();
  }

  onApplicationShutdown(): void {
    this.close();
  }

  close(): void {
    if (this.closed) return;
    this.db.close();
    this.closed = true;
  }

  private initializeSchema(): void {
    this.db.exec(`
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
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
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
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        due_at TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'normal',
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kind TEXT NOT NULL,
        description TEXT NOT NULL,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
        deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      CREATE INDEX IF NOT EXISTS contacts_company_idx ON contacts(company);
      CREATE INDEX IF NOT EXISTS contacts_status_idx ON contacts(status);
      CREATE INDEX IF NOT EXISTS deals_stage_idx ON deals(stage);
      CREATE INDEX IF NOT EXISTS activities_created_idx ON activities(created_at DESC);
    `);
  }

  private seedDatabase(): void {
    const row = this.db
      .prepare("SELECT COUNT(*) AS count FROM contacts")
      .get() as { count: number };
    if (row.count > 0) return;

    const insertContact = this.db.prepare(`
      INSERT INTO contacts (
        first_name, last_name, email, phone, company, title, status, source, city,
        last_contacted_at, created_at, updated_at
      ) VALUES (
        @firstName, @lastName, @email, @phone, @company, @title, @status, @source,
        @city, @lastContactedAt, @createdAt, @createdAt
      )
    `);
    const insertDeal = this.db.prepare(`
      INSERT INTO deals (
        name, contact_id, company, value, stage, probability, close_date, created_at, updated_at
      ) VALUES (
        @name, @contactId, @company, @value, @stage, @probability, @closeDate,
        @createdAt, @createdAt
      )
    `);
    const insertTask = this.db.prepare(`
      INSERT INTO tasks (title, contact_id, due_at, priority)
      VALUES (@title, @contactId, @dueAt, @priority)
    `);
    const insertActivity = this.db.prepare(`
      INSERT INTO activities (kind, description, contact_id, deal_id, created_at)
      VALUES (@kind, @description, @contactId, @dealId, @createdAt)
    `);

    this.db.transaction(() => {
      const contactIds = new Map<string, number>();

      seedContacts.forEach((contact, index) => {
        const result = insertContact.run({
          ...contact,
          lastContactedAt: formatDateOffset(-contact.lastContactedDaysAgo),
          createdAt: formatDateOffset(-(index * 7 + 2)),
        });
        contactIds.set(contact.email, Number(result.lastInsertRowid));
      });

      seedDeals.forEach((deal, index) => {
        const contactId = contactIds.get(deal.contactEmail) ?? null;
        const result = insertDeal.run({
          ...deal,
          contactId,
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
          contactId,
          dealId,
          createdAt: formatDateOffset(-(index % 5)),
        });
      });

      [
        ["Send proposal follow-up", "olivia@northstar.studio", 0, "high"],
        ["Prepare pricing options", "marcus@fieldworklabs.com", 1, "high"],
        ["Book discovery call", "sofia@lumoncoffee.co", 2, "normal"],
        ["Share onboarding timeline", "amara@cascadehealth.io", 4, "normal"],
      ].forEach(([title, email, dueInDays, priority]) => {
        insertTask.run({
          title,
          contactId: contactIds.get(email as string),
          dueAt: formatDateOffset(dueInDays as number),
          priority,
        });
      });
    })();
  }

  listContacts(
    { search = "", status = "All" }: { search?: string; status?: ContactStatus | "All" } = {},
  ): Contact[] {
    const filters: string[] = [];
    const params: Record<string, string> = {};

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
    return (
      this.db
        .prepare(`${this.contactSelect}${where} ORDER BY updated_at DESC, id DESC`)
        .all(params) as ContactRow[]
    ).map((row) => mapContact(row) as Contact);
  }

  getContact(id: number): Contact | null {
    return mapContact(
      this.db
        .prepare(`${this.contactSelect} WHERE id = ?`)
        .get(id) as ContactRow | undefined,
    );
  }

  createContact(input: ContactInput): Contact {
    const contact = {
      phone: "",
      title: "",
      status: "Lead" as ContactStatus,
      source: "Website",
      city: "",
      notes: "",
      ...input,
    };
    const result = this.db
      .prepare(`
        INSERT INTO contacts (
          first_name, last_name, email, phone, company, title, status, source,
          city, notes, last_contacted_at
        ) VALUES (
          @firstName, @lastName, @email, @phone, @company, @title, @status,
          @source, @city, @notes, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        )
      `)
      .run(contact);
    const id = Number(result.lastInsertRowid);

    this.db
      .prepare(`
        INSERT INTO activities (kind, description, contact_id)
        VALUES ('contact_created', @description, @contactId)
      `)
      .run({
        description: `Added ${contact.firstName} ${contact.lastName}`,
        contactId: id,
      });

    return this.getContact(id) as Contact;
  }

  updateContact(id: number, input: Partial<ContactInput>): Contact | null {
    const existing = this.getContact(id);
    if (!existing) return null;
    const next = { ...existing, ...input, id };

    this.db
      .prepare(`
        UPDATE contacts SET
          first_name = @firstName, last_name = @lastName, email = @email,
          phone = @phone, company = @company, title = @title, status = @status,
          source = @source, city = @city, notes = @notes,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = @id
      `)
      .run(next);
    return this.getContact(id);
  }

  deleteContact(id: number): boolean {
    return this.db.prepare("DELETE FROM contacts WHERE id = ?").run(id).changes > 0;
  }

  listDeals({ stage }: { stage?: DealStage } = {}): Deal[] {
    const where = stage ? " WHERE d.stage = @stage" : "";
    return (
      this.db
        .prepare(`
          ${this.dealSelect}${where}
          ORDER BY CASE d.stage
            WHEN 'Qualified' THEN 1 WHEN 'Proposal' THEN 2
            WHEN 'Negotiation' THEN 3 WHEN 'Won' THEN 4 ELSE 5 END,
            d.updated_at DESC, d.id DESC
        `)
        .all(stage ? { stage } : {}) as DealRow[]
    ).map((row) => mapDeal(row) as Deal);
  }

  getDeal(id: number): Deal | null {
    return mapDeal(
      this.db
        .prepare(`${this.dealSelect} WHERE d.id = ?`)
        .get(id) as DealRow | undefined,
    );
  }

  createDeal(input: DealInput): Deal {
    const deal = {
      contactId: null,
      stage: "Qualified" as DealStage,
      probability: 25,
      closeDate: null,
      ...input,
    };
    const result = this.db
      .prepare(`
        INSERT INTO deals (
          name, contact_id, company, value, stage, probability, close_date
        ) VALUES (
          @name, @contactId, @company, @value, @stage, @probability, @closeDate
        )
      `)
      .run(deal);
    const id = Number(result.lastInsertRowid);

    this.db
      .prepare(`
        INSERT INTO activities (kind, description, contact_id, deal_id)
        VALUES ('deal_created', @description, @contactId, @dealId)
      `)
      .run({
        description: `Created ${deal.name}`,
        contactId: deal.contactId,
        dealId: id,
      });

    return this.getDeal(id) as Deal;
  }

  updateDeal(id: number, input: Partial<DealInput>): Deal | null {
    const existing = this.getDeal(id);
    if (!existing) return null;
    const next = { ...existing, ...input, id };
    const stageChanged = existing.stage !== next.stage;

    this.db
      .prepare(`
        UPDATE deals SET
          name = @name, contact_id = @contactId, company = @company,
          value = @value, stage = @stage, probability = @probability,
          close_date = @closeDate,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = @id
      `)
      .run(next);

    if (stageChanged) {
      this.db
        .prepare(`
          INSERT INTO activities (kind, description, contact_id, deal_id)
          VALUES (@kind, @description, @contactId, @dealId)
        `)
        .run({
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
  }

  deleteDeal(id: number): boolean {
    return this.db.prepare("DELETE FROM deals WHERE id = ?").run(id).changes > 0;
  }

  completeTask(id: number, completed: boolean): CrmTask | null {
    const result = this.db
      .prepare("UPDATE tasks SET completed = @completed WHERE id = @id")
      .run({ id, completed: completed ? 1 : 0 });
    if (!result.changes) return null;

    const row = this.db
      .prepare(`
        SELECT t.*, TRIM(c.first_name || ' ' || c.last_name) AS contact_name,
          c.company
        FROM tasks t
        LEFT JOIN contacts c ON c.id = t.contact_id
        WHERE t.id = ?
      `)
      .get(id) as Record<string, string | number | null>;
    return {
      id: row.id as number,
      title: row.title as string,
      dueAt: row.due_at as string,
      priority: row.priority as string,
      completed: Boolean(row.completed),
      contactName: row.contact_name as string | null,
      company: row.company as string | null,
    };
  }

  getDashboard(): Dashboard {
    const contactCount = (
      this.db.prepare("SELECT COUNT(*) AS count FROM contacts").get() as {
        count: number;
      }
    ).count;
    const customerCount = (
      this.db
        .prepare("SELECT COUNT(*) AS count FROM contacts WHERE status = 'Customer'")
        .get() as { count: number }
    ).count;
    const pipelineValue = (
      this.db
        .prepare(`
          SELECT COALESCE(SUM(value), 0) AS value FROM deals
          WHERE stage NOT IN ('Won', 'Lost')
        `)
        .get() as { value: number }
    ).value;
    const weightedValue = (
      this.db
        .prepare(`
          SELECT COALESCE(SUM(value * probability / 100), 0) AS value FROM deals
          WHERE stage NOT IN ('Won', 'Lost')
        `)
        .get() as { value: number }
    ).value;
    const outcomes = this.db
      .prepare(`
        SELECT
          SUM(CASE WHEN stage = 'Won' THEN 1 ELSE 0 END) AS won,
          SUM(CASE WHEN stage = 'Lost' THEN 1 ELSE 0 END) AS lost
        FROM deals
      `)
      .get() as { won: number | null; lost: number | null };
    const won = outcomes.won ?? 0;
    const lost = outcomes.lost ?? 0;
    const winRate = won + lost ? Math.round((won / (won + lost)) * 100) : 0;
    const openTasks = (
      this.db
        .prepare("SELECT COUNT(*) AS count FROM tasks WHERE completed = 0")
        .get() as { count: number }
    ).count;

    const pipeline = this.db
      .prepare(`
        SELECT stage, COUNT(*) AS count, COALESCE(SUM(value), 0) AS value
        FROM deals WHERE stage != 'Lost' GROUP BY stage
      `)
      .all() as PipelineSummary[];

    const tasks = (
      this.db
        .prepare(`
          SELECT t.id, t.title, t.due_at, t.priority, t.completed,
            TRIM(c.first_name || ' ' || c.last_name) AS contact_name, c.company
          FROM tasks t
          LEFT JOIN contacts c ON c.id = t.contact_id
          WHERE t.completed = 0 ORDER BY t.due_at ASC LIMIT 5
        `)
        .all() as Array<Record<string, string | number | null>>
    ).map(
      (task): CrmTask => ({
        id: task.id as number,
        title: task.title as string,
        dueAt: task.due_at as string,
        priority: task.priority as string,
        completed: Boolean(task.completed),
        contactName: task.contact_name as string | null,
        company: task.company as string | null,
      }),
    );

    const activities = (
      this.db
        .prepare(`
          SELECT a.id, a.kind, a.description, a.created_at,
            TRIM(COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')) AS contact_name
          FROM activities a
          LEFT JOIN contacts c ON c.id = a.contact_id
          ORDER BY a.created_at DESC, a.id DESC LIMIT 6
        `)
        .all() as Array<Record<string, string | number | null>>
    ).map(
      (activity): Activity => ({
        id: activity.id as number,
        kind: activity.kind as string,
        description: activity.description as string,
        contactName: (activity.contact_name as string) || null,
        createdAt: activity.created_at as string,
      }),
    );

    const recentContacts = (
      this.db
        .prepare(`${this.contactSelect} ORDER BY created_at DESC, id DESC LIMIT 5`)
        .all() as ContactRow[]
    ).map((row) => mapContact(row) as Contact);

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
  }
}
