import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createCrmApp } from "../../backend/app.js";
import { createCrmStore } from "../../backend/database.js";

const openStores = [];

function testApp(options = {}) {
  const app = createCrmApp({ databasePath: ":memory:", ...options });
  openStores.push(app.locals.crmStore);
  return app;
}

afterEach(() => {
  while (openStores.length) {
    openStores.pop().close();
  }
});

describe("CRM API", () => {
  it("returns a dashboard assembled from seeded SQLite data", async () => {
    const app = testApp();

    const response = await request(app).get("/api/dashboard").expect(200);

    expect(response.body.metrics.contactCount).toBe(8);
    expect(response.body.metrics.pipelineValue).toBe(236000);
    expect(response.body.metrics.winRate).toBe(67);
    expect(response.body.pipeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stage: "Qualified", count: 2 }),
        expect.objectContaining({ stage: "Won", count: 2 }),
      ]),
    );
    expect(response.body.tasks).toHaveLength(4);
  });

  it("validates and creates a searchable contact", async () => {
    const app = testApp();

    const invalid = await request(app)
      .post("/api/contacts")
      .send({ firstName: "Ari" })
      .expect(422);

    expect(invalid.body.errors).toMatchObject({
      lastName: expect.any(String),
      email: expect.any(String),
      company: expect.any(String),
    });

    const created = await request(app)
      .post("/api/contacts")
      .send({
        firstName: "Ari",
        lastName: "Monroe",
        email: "ari@papertrail.co",
        company: "Papertrail",
        title: "Founder",
        status: "Prospect",
        phone: "",
        source: "Referral",
        city: "Austin",
        notes: "Interested in an annual plan.",
      })
      .expect(201);

    expect(created.body.contact).toMatchObject({
      name: "Ari Monroe",
      email: "ari@papertrail.co",
      company: "Papertrail",
    });

    const results = await request(app)
      .get("/api/contacts?search=papertrail&status=Prospect")
      .expect(200);

    expect(results.body.contacts).toHaveLength(1);
    expect(results.body.contacts[0].name).toBe("Ari Monroe");
  });

  it("creates a deal and persists stage changes in the forecast", async () => {
    const app = testApp();
    const before = await request(app).get("/api/dashboard").expect(200);

    const created = await request(app)
      .post("/api/deals")
      .send({
        name: "Regional rollout",
        company: "Papertrail",
        value: 30000,
        stage: "Qualified",
        probability: 35,
        closeDate: "2026-09-10",
      })
      .expect(201);

    const moved = await request(app)
      .patch(`/api/deals/${created.body.deal.id}`)
      .send({ stage: "Won" })
      .expect(200);

    expect(moved.body.deal.stage).toBe("Won");

    const deals = await request(app).get("/api/deals").expect(200);
    expect(deals.body.deals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Regional rollout",
          stage: "Won",
        }),
      ]),
    );

    const after = await request(app).get("/api/dashboard").expect(200);
    expect(after.body.metrics.pipelineValue).toBe(
      before.body.metrics.pipelineValue,
    );
  });
});

describe("SQLite persistence", () => {
  it("keeps newly created contacts after the database is reopened", () => {
    const directory = mkdtempSync(join(tmpdir(), "ava-crm-"));
    const databasePath = join(directory, "crm.sqlite");

    try {
      const firstStore = createCrmStore({
        databasePath,
        reset: true,
        seed: false,
      });
      firstStore.createContact({
        firstName: "Nora",
        lastName: "Kim",
        email: "nora@persistent.test",
        phone: "",
        company: "Longview",
        title: "",
        status: "Lead",
        source: "Website",
        city: "",
        notes: "",
      });
      firstStore.close();

      const secondStore = createCrmStore({
        databasePath,
        seed: false,
      });
      const contacts = secondStore.listContacts();
      secondStore.close();

      expect(contacts).toHaveLength(1);
      expect(contacts[0]).toMatchObject({
        name: "Nora Kim",
        email: "nora@persistent.test",
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
