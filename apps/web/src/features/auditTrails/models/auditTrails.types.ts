export type AuditOutcome = "SUCCESS" | "FAIL" | "DENY";

export type AuditLogItem = {
  eventId: string;
  timestamp: string;
  eventType: string;
  severity: string;
  action: string;
  outcome: AuditOutcome;
  actor?: {
    id?: string;
    role?: string;
    email?: string;
  };
  target?: {
    type?: string;
    id?: string;
  };
  request?: {
    method?: string;
    path?: string;
    requestId?: string;
    correlationId?: string;
  };
  scopeBarangay?: string;
};

export type AuditLogListResponse = {
  items: AuditLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
