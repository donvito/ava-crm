import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";
import request from "supertest";
import { configureCrmApplication } from "../../backend/src/application";
import { CrmModule } from "../../backend/src/crm/crm.module";
import {
  CRM_DATABASE_OPTIONS,
  CrmStore,
} from "../../backend/src/database/crm-store.service";

let app: INestApplication | undefined;

async function testApplication(): Promise<INestApplication> {
  const testingModule = await Test.createTestingModule({
    imports: [CrmModule],
  })
    .overrideProvider(CRM_DATABASE_OPTIONS)
    .useValue({ databasePath: ":memory:", seed: true })
    .compile();

  app = testingModule.createNestApplication();
  configureCrmApplication(app);
  await app.init();
  return app;
}

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

describe("NestJS CRM API", () => {
  it("reports its framework and SQLite health", async () => {
    const application = await testApplication();

    const response = await request(application.getHttpServer())
      .get("/api/health")
      .expect(200);

    assert.deepEqual(response.body, {
      status: "ok",
      database: "sqlite",
      framework: "nestjs",
    });
  });

  it("returns a dashboard assembled from seeded SQLite data", async () => {
    const application = await testApplication();

    const response = await request(application.getHttpServer())
      .get("/api/dashboard")
      .expect(200);

    assert.equal(response.body.metrics.contactCount, 8);
    assert.equal(response.body.metrics.pipelineValue, 236000);
    assert.equal(response.body.metrics.winRate, 67);
    assert.equal(
      response.body.pipeline.find(
        (stage: { stage: string }) => stage.stage === "Qualified",
      ).count,
      2,
    );
    assert.equal(
      response.body.pipeline.find(
        (stage: { stage: string }) => stage.stage === "Won",
      ).count,
      2,
    );
    assert.equal(response.body.tasks.length, 4);
  });

  it("validates and creates a searchable contact", async () => {
    const application = await testApplication();
    const server = application.getHttpServer();

    const invalid = await request(server)
      .post("/api/contacts")
      .send({ firstName: "Ari" })
      .expect(422);

    assert.equal(typeof invalid.body.errors.lastName, "string");
    assert.equal(typeof invalid.body.errors.email, "string");
    assert.equal(typeof invalid.body.errors.company, "string");

    const created = await request(server)
      .post("/api/contacts")
      .send({
        firstName: "Ari",
        lastName: "Monroe",
        email: "ARI@PAPERTRAIL.CO",
        company: "Papertrail",
        title: "Founder",
        status: "Prospect",
        source: "Referral",
        city: "Austin",
        notes: "Interested in an annual plan.",
      })
      .expect(201);

    assert.equal(created.body.contact.name, "Ari Monroe");
    assert.equal(created.body.contact.email, "ari@papertrail.co");
    assert.equal(created.body.contact.company, "Papertrail");

    const results = await request(server)
      .get("/api/contacts?search=papertrail&status=Prospect")
      .expect(200);

    assert.equal(results.body.contacts.length, 1);
    assert.equal(results.body.contacts[0].name, "Ari Monroe");
  });

  it("creates a deal and persists stage changes in the forecast", async () => {
    const application = await testApplication();
    const server = application.getHttpServer();
    const before = await request(server).get("/api/dashboard").expect(200);

    const created = await request(server)
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

    const moved = await request(server)
      .patch(`/api/deals/${created.body.deal.id}`)
      .send({ stage: "Won" })
      .expect(200);

    assert.equal(moved.body.deal.stage, "Won");

    const deals = await request(server).get("/api/deals").expect(200);
    assert.ok(
      deals.body.deals.some(
        (deal: { name: string; stage: string }) =>
          deal.name === "Regional rollout" && deal.stage === "Won",
      ),
    );

    const after = await request(server).get("/api/dashboard").expect(200);
    assert.equal(
      after.body.metrics.pipelineValue,
      before.body.metrics.pipelineValue,
    );
  });
});

describe("SQLite persistence", () => {
  it("keeps newly created contacts after the Nest store is reopened", () => {
    const directory = mkdtempSync(join(tmpdir(), "ava-crm-nest-"));
    const databasePath = join(directory, "crm.sqlite");

    try {
      const firstStore = new CrmStore({
        databasePath,
        reset: true,
        seed: false,
      });
      firstStore.createContact({
        firstName: "Nora",
        lastName: "Kim",
        email: "nora@persistent.test",
        company: "Longview",
      });
      firstStore.close();

      const secondStore = new CrmStore({ databasePath, seed: false });
      const contacts = secondStore.listContacts();
      secondStore.close();

      assert.equal(contacts.length, 1);
      assert.equal(contacts[0].name, "Nora Kim");
      assert.equal(contacts[0].email, "nora@persistent.test");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
