import { api } from "../../../lib/api";
import type { DispatchOffer } from "../models/dispatch.types";

const DISPATCH_BASE = "/api/dispatches";

export async function getMyPendingDispatch(): Promise<DispatchOffer | null> {
  const res = await api.get<{ data: DispatchOffer | null }>(`${DISPATCH_BASE}/my/pending`);
  return (res.data?.data ?? null) as DispatchOffer | null;
}

export async function respondToDispatch(offerId: string, decision: "ACCEPT" | "DECLINE"): Promise<DispatchOffer> {
  const res = await api.patch<{ data: DispatchOffer }>(`${DISPATCH_BASE}/${offerId}/respond`, { decision });
  const offer = res.data?.data as DispatchOffer | undefined;
  if (!offer) throw new Error("No dispatch returned");
  return offer;
}
