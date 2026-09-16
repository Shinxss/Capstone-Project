export type ResponderAccountState = {
  isActive: boolean;
  onDuty: boolean;
};

type PartialResponderAccountState = {
  isActive?: boolean;
  onDuty?: boolean;
};

export const DISPATCHABLE_RESPONDER_STATE = Object.freeze({
  isActive: true,
  onDuty: true,
});

export function normalizeResponderAccountState(
  state: PartialResponderAccountState,
  defaults: ResponderAccountState = { isActive: true, onDuty: true }
): ResponderAccountState {
  const isActive = Boolean(state.isActive ?? defaults.isActive);
  const onDuty = isActive && Boolean(state.onDuty ?? defaults.onDuty);

  return { isActive, onDuty };
}

export function buildResponderAccountCreationState(
  payload: PartialResponderAccountState
): ResponderAccountState {
  return normalizeResponderAccountState(payload);
}

export function buildResponderAccountUpdateState(
  existing: PartialResponderAccountState,
  payload: PartialResponderAccountState
): ResponderAccountState {
  const current = normalizeResponderAccountState(existing);
  const isReactivation = payload.isActive === true && !current.isActive;

  return normalizeResponderAccountState({
    isActive: payload.isActive ?? current.isActive,
    onDuty: payload.onDuty ?? (isReactivation ? false : current.onDuty),
  });
}

export function buildResponderActivationState(isActive: boolean): ResponderAccountState {
  return {
    isActive,
    onDuty: false,
  };
}

export function isResponderDispatchableState(state: PartialResponderAccountState) {
  const normalized = normalizeResponderAccountState(state);
  return normalized.isActive && normalized.onDuty;
}

export function isImpossibleResponderAccountFilter(filters: {
  isActive?: "true" | "false";
  onDuty?: "true" | "false";
}) {
  return filters.isActive === "false" && filters.onDuty === "true";
}
