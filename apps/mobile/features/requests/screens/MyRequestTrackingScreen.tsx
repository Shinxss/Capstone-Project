import { router, useLocalSearchParams } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { Alert, Image, Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../../auth/hooks/useSession";
import { usePullToRefresh } from "../../common/hooks/usePullToRefresh";
import { VolunteerReviewSummaryCard } from "../components/VolunteerReviewSummaryCard";
import { useMyRequestReview } from "../hooks/useMyRequestReview";
import { useRequestLiveTracking } from "../hooks/useRequestLiveTracking";
import { EmergencyDetailsCard } from "../tracking/components/EmergencyDetailsCard";
import { IncidentProgressCard } from "../tracking/components/IncidentProgressCard";
import { LiveTrackingHeader } from "../tracking/components/LiveTrackingHeader";
import { ResponderStatusCard } from "../tracking/components/ResponderStatusCard";
import { TrackingActionBar } from "../tracking/components/TrackingActionBar";
import { TrackingMapCard } from "../tracking/components/TrackingMapCard";
import { TrackingOfflineNotice, TrackingSkeleton, TrackingState } from "../tracking/components/TrackingStates";
import { useEmergencyHotline } from "../tracking/hooks/useEmergencyHotline";
import { formatRequestType, formatTrackingDate, isClosedTrackingStatus, normalizeTrackingLabel, toCoordinate } from "../tracking/utils/tracking.utils";
import { formatEtaText } from "../utils/formatters";

function assetUrl(raw: string) { const value = raw.trim(); if (!value || /^https?:\/\//i.test(value)) return value; const base = String(process.env.EXPO_PUBLIC_API_URL ?? "").trim(); return base ? `${base.replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}` : value; }

export function MyRequestTrackingScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const requestId = Array.isArray(params.id) ? String(params.id[0] ?? "") : String(params.id ?? "");
  const { isUser, session } = useSession(); const isFocused = useIsFocused();
  const { data, loading, error, refresh, lastUpdatedAgoText } = useRequestLiveTracking(requestId, { pollMs: 6000, enabled: isUser && isFocused && Boolean(requestId) });
  const { data: reviewData, loading: reviewLoading, refresh: refreshReview } = useMyRequestReview(requestId, { enabled: isUser && isFocused && Boolean(requestId) });
  const { emergencyHotline, callEmergencyHotline } = useEmergencyHotline();
  const refreshTracking = useCallback(async () => { await Promise.all([refresh(), refreshReview()]); }, [refresh, refreshReview]);
  const { refreshing, triggerRefresh } = usePullToRefresh(refreshTracking);
  const emergencyCoordinate = useMemo(() => toCoordinate(data?.request.location), [data?.request.location]); const responderCoordinate = useMemo(() => toCoordinate(data?.tracking.responderLocation), [data?.tracking.responderLocation]);
  const trackingLabel = useMemo(() => normalizeTrackingLabel(data?.tracking.label), [data?.tracking.label]); const closed = isClosedTrackingStatus(trackingLabel); const cancelled = trackingLabel === "Cancelled"; const rejected = cancelled && String(data?.request.status ?? "").trim().toUpperCase() !== "CANCELLED";
  const statusLabel = rejected ? "Rejected" : trackingLabel; const statusMessage = rejected ? "Request rejected by LGU." : formatEtaText(data?.tracking.etaSeconds, trackingLabel); const type = formatRequestType(data?.request.type); const title = type.toLowerCase().includes("emergency") ? type : `${type} Emergency`;
  const location = String(data?.request.locationText ?? "").trim() || (emergencyCoordinate ? `${emergencyCoordinate[1].toFixed(5)}, ${emergencyCoordinate[0].toFixed(5)}` : "Location unavailable"); const phone = String(data?.tracking.responder?.phone ?? "").trim();
  const token = useMemo(() => isUser && session?.mode === "user" ? String(session.user.accessToken ?? "").trim() : "", [isUser, session]); const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : undefined, [token]);
  const proofs = useMemo(() => (data?.tracking.proofs ?? []).map((proof, index) => ({ key: `${proof.url}-${index}`, uri: assetUrl(String(proof.url ?? "")), uploadedAt: proof.uploadedAt })).filter((proof) => Boolean(proof.uri)), [data?.tracking.proofs]);
  const showProofs = trackingLabel === "Resolved" || proofs.length > 0; const showReview = trackingLabel === "Resolved" || Boolean(reviewData?.review) || Boolean(reviewData?.reviewable); const reviewLabel = reviewLoading && !reviewData ? null : reviewData?.reviewable && !reviewData.review ? "Leave Review" : reviewData?.review ? "Open Full Review" : null;
  const openReview = useCallback(() => router.push({ pathname: "/my-requests/review", params: { id: requestId } }), [requestId]);
  const callResponder = useCallback(() => { if (!phone) return; Alert.alert("Call responder?", `Open your phone dialer with ${phone}?`, [{ text: "Cancel", style: "cancel" }, { text: "Open Dialer", onPress: () => { void Linking.openURL(`tel:${phone}`); } }]); }, [phone]);

  if (!isUser) return <SafeAreaView style={styles.safe}><TrackingState icon="lock-closed-outline" title="Sign in required" message="Please sign in to access request tracking." actionLabel="Go to Login" onAction={() => router.replace("/(auth)/login")} /></SafeAreaView>;
  if (!requestId) return <SafeAreaView style={styles.safe}><TrackingState icon="alert-circle-outline" title="No request selected" message="Choose an emergency request to view its live tracking information." actionLabel="Go Back" onAction={() => router.back()} /></SafeAreaView>;
  return <SafeAreaView style={styles.safe} edges={["top"]}><LiveTrackingHeader />{loading && !data ? <TrackingSkeleton /> : !data ? <TrackingState icon="cloud-offline-outline" title="Tracking unavailable" message="We couldn’t load this emergency’s tracking details. Please check your connection and try again." actionLabel="Retry" onAction={() => void refreshTracking()} /> : <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={triggerRefresh} tintColor="#DC2626" />}><TrackingMapCard emergencyCoordinate={emergencyCoordinate} responderCoordinate={responderCoordinate} routeGeometry={data.tracking.routeGeometry ?? null} lastUpdatedText={lastUpdatedAgoText} closed={closed} />{error ? <TrackingOfflineNotice /> : null}<ResponderStatusCard responder={data.tracking.responder} trackingLabel={trackingLabel} etaText={statusMessage} onCall={phone && !closed ? callResponder : undefined} /><EmergencyDetailsCard title={title} status={statusLabel} trackingLabel={trackingLabel} location={location} statusMessage={statusMessage} priority={data.request.priority} referenceNumber={data.request.referenceNumber} incidentType={type} reportedAt={formatTrackingDate(data.request.createdAt)} lastUpdated={lastUpdatedAgoText} notes={String(data.request.notes ?? "").trim()} rejectionReason={rejected ? String(data.request.rejectionReason ?? "").trim() || "No rejection reason was provided by the LGU." : undefined} />{!cancelled ? <IncidentProgressCard timeline={data.timeline} /> : null}{showProofs ? <View style={styles.proofCard}><Text style={styles.sectionTitle}>Volunteer Proof</Text>{proofs.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.proofList}>{proofs.map((proof) => <View key={proof.key} style={styles.proofTile}><Image source={headers ? { uri: proof.uri, headers } : { uri: proof.uri }} style={styles.proofImage} /><Text style={styles.proofMeta}>{proof.uploadedAt ? `Uploaded ${formatTrackingDate(proof.uploadedAt)}` : "Volunteer proof"}</Text></View>)}</ScrollView> : <Text style={styles.emptyText}>No uploaded volunteer proof yet.</Text>}</View> : null}{showReview ? <View style={styles.reviewWrap}><VolunteerReviewSummaryCard data={reviewData} loading={reviewLoading} primaryLabel={reviewLabel} onPressPrimary={reviewLabel ? openReview : undefined} /></View> : null}<TrackingActionBar onCallHotline={callEmergencyHotline} hotline={emergencyHotline} resolved={trackingLabel === "Resolved"} /></ScrollView>}</SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: "#F8FAFC" }, scroll: { flex: 1 }, content: { gap: 14, paddingBottom: 28 }, proofCard: { marginHorizontal: 16, borderRadius: 22, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#FFF", padding: 16, shadowColor: "#0F172A", shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }, sectionTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" }, proofList: { gap: 10, paddingTop: 12, paddingRight: 4 }, proofTile: { width: 180 }, proofImage: { width: "100%", height: 126, borderRadius: 14, backgroundColor: "#E2E8F0" }, proofMeta: { marginTop: 6, fontSize: 11, fontWeight: "600", color: "#64748B" }, emptyText: { marginTop: 10, fontSize: 13, fontWeight: "600", color: "#64748B" }, reviewWrap: { marginHorizontal: 16 } });
