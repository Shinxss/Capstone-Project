import assert from "node:assert/strict";
import test from "node:test";
import { nearestAvailableResponderIds } from "../src/features/lguLiveMap/dispatch/utils/dispatchResponder.utils";
import type { Volunteer } from "../src/features/lguLiveMap/models/lguLiveMap.types";
import {
  removeDeploymentIntentParam,
  resolveDeploymentIntent,
  resolveDeploymentModalAction,
} from "../src/features/lguLiveMap/utils/deploymentIntent.utils";
import {
  buildVolunteerDeploymentPath,
  resolveVerifiedVolunteerAction,
  resolveVerifiedVolunteerUserId,
} from "../src/features/volunteer/utils/verifiedVolunteerDeployment";

function volunteer(overrides: Partial<Volunteer> = {}): Volunteer {
  return {
    id: "volunteer-a",
    name: "Juan Dela Cruz",
    status: "available",
    skill: "First Aid",
    ...overrides,
  };
}

test("available volunteer actions deploy with the User account ID", () => {
  const application = { _id: "application-id", userId: "user-account-id" };

  assert.equal(resolveVerifiedVolunteerAction("available"), "deploy");
  assert.equal(resolveVerifiedVolunteerUserId(application), "user-account-id");
  assert.equal(
    buildVolunteerDeploymentPath("user-account-id"),
    "/lgu/live-map?deployVolunteerId=user-account-id"
  );
});

test("verified volunteer ID resolution safely falls back to _id", () => {
  assert.equal(
    resolveVerifiedVolunteerUserId({ _id: "fallback-user-id", userId: "   " }),
    "fallback-user-id"
  );
});

test("offline and deployed volunteer actions remain View actions", () => {
  assert.equal(resolveVerifiedVolunteerAction("offline"), "view");
  assert.equal(resolveVerifiedVolunteerAction("deployed"), "view");
});

test("deep-link intent waits for canonical volunteers then resolves only available targets", () => {
  const available = volunteer();

  assert.deepEqual(resolveDeploymentIntent([], available.id, false), { kind: "waiting" });
  assert.equal(resolveDeploymentIntent([available], available.id, true).kind, "ready");
  assert.equal(
    resolveDeploymentIntent([{ ...available, status: "offline" }], available.id, true).kind,
    "unavailable"
  );
  assert.deepEqual(resolveDeploymentIntent([], available.id, true), {
    kind: "missing",
    volunteerId: available.id,
  });
});

test("cancel removes only deployVolunteerId and preserves unrelated query parameters", () => {
  const result = removeDeploymentIntentParam(
    new URLSearchParams("emergencyId=emergency-a&deployVolunteerId=volunteer-a&panel=details")
  );

  assert.equal(result.get("deployVolunteerId"), null);
  assert.equal(result.get("emergencyId"), "emergency-a");
  assert.equal(result.get("panel"), "details");
});

test("deployment modal waits for tasks from the selected emergency", () => {
  assert.deepEqual(
    resolveDeploymentModalAction({
      volunteerId: "volunteer-a",
      selectedEmergencyId: "emergency-new",
      hasEmergencyDetails: true,
      tasksLoading: false,
      tasksError: null,
      tasksLoadedEmergencyId: "emergency-old",
      assignedIds: new Set(),
    }),
    { kind: "wait" }
  );
});

test("deployment modal preselects only the intended volunteer after tasks load", () => {
  assert.deepEqual(
    resolveDeploymentModalAction({
      volunteerId: "volunteer-a",
      selectedEmergencyId: "emergency-a",
      hasEmergencyDetails: true,
      tasksLoading: false,
      tasksError: null,
      tasksLoadedEmergencyId: "emergency-a",
      assignedIds: new Set(),
    }),
    { kind: "open", selectedIds: ["volunteer-a"] }
  );
});

test("already-assigned target cannot open a duplicate deployment", () => {
  assert.deepEqual(
    resolveDeploymentModalAction({
      volunteerId: "volunteer-a",
      selectedEmergencyId: "emergency-a",
      hasEmergencyDetails: true,
      tasksLoading: false,
      tasksError: null,
      tasksLoadedEmergencyId: "emergency-a",
      assignedIds: new Set(["volunteer-a"]),
    }),
    { kind: "already-assigned" }
  );
});

test("normal Live Map flow still recommends the nearest two available responders", () => {
  const volunteers = [
    volunteer({ id: "far", lng: 120.5, lat: 16.2 }),
    volunteer({ id: "nearest", lng: 120.301, lat: 16.001 }),
    volunteer({ id: "near", lng: 120.31, lat: 16.01 }),
    volunteer({ id: "offline", status: "offline", lng: 120.3, lat: 16 }),
  ];

  assert.deepEqual(
    nearestAvailableResponderIds(volunteers, { lng: 120.3, lat: 16 }, new Set()),
    ["nearest", "near"]
  );
});
