/**
 * Thin authenticated client for the QuickBooks v3 Accounting API.
 * Plain fetch — no SDK dependency — so the exact request/response shape
 * stays visible and testable.
 */
import { qboApiBase, QBO_MINOR_VERSION } from "./config";

export class QboError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "QboError";
  }
}

export type QboEntity = Record<string, unknown>;

export class QboClient {
  constructor(
    private readonly realmId: string,
    private readonly accessToken: string,
  ) {}

  private get base(): string {
    return qboApiBase(this.realmId);
  }

  /** Low-level request (public for item/void operations that have no helper). */
  async request(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<QboEntity> {
    const res = await fetch(`${this.base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    let json: QboEntity = {};
    try {
      json = (await res.json()) as QboEntity;
    } catch {
      // Non-JSON error body; fall through to the status check below.
    }

    if (!res.ok) {
      const fault = (json.Fault as QboEntity | undefined)?.Error as
        | { Message?: string; code?: string }[]
        | undefined;
      const first = Array.isArray(fault) ? fault[0] : undefined;
      throw new QboError(
        first?.Message ?? `QuickBooks API error (HTTP ${res.status})`,
        res.status,
        first?.code,
      );
    }
    return json;
  }

  /** Intuit Query Language: e.g. "select * from Customer where ..." */
  async query<T = QboEntity>(qboQuery: string): Promise<T[]> {
    const params = new URLSearchParams({
      query: qboQuery,
      minorversion: String(QBO_MINOR_VERSION),
    });
    const json = await this.request("GET", `/query?${params.toString()}`);
    const qr = json.QueryResponse as { [k: string]: T[] } | undefined;
    if (!qr) return [];
    const key = Object.keys(qr)[0];
    return key ? (qr[key] ?? []) : [];
  }

  async create(entity: "customer" | "invoice" | "payment", payload: QboEntity): Promise<QboEntity> {
    const json = await this.request("POST", `/${entity}?minorversion=${QBO_MINOR_VERSION}`, payload);
    const key = entity[0].toUpperCase() + entity.slice(1);
    return (json[key] as QboEntity) ?? {};
  }

  /** Sparse update: payload must include Id and SyncToken. */
  async sparseUpdate(
    entity: "customer" | "invoice",
    payload: QboEntity,
  ): Promise<QboEntity> {
    const json = await this.request(
      "POST",
      `/${entity}?minorversion=${QBO_MINOR_VERSION}`,
      { ...payload, sparse: true },
    );
    const key = entity[0].toUpperCase() + entity.slice(1);
    return (json[key] as QboEntity) ?? {};
  }

  async getCompanyInfo(): Promise<QboEntity> {
    const json = await this.request(
      "GET",
      `/companyinfo/${this.realmId}?minorversion=${QBO_MINOR_VERSION}`,
    );
    return (json.CompanyInfo as QboEntity) ?? {};
  }
}
