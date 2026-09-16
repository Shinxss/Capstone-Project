type ResponderDutyState = {
  isActive: boolean;
  onDuty: boolean;
};

export function isResponderEffectivelyOnDuty(state: ResponderDutyState) {
  return state.isActive && state.onDuty;
}

export function isResponderDutyControlDisabled(state: Pick<ResponderDutyState, "isActive">) {
  return !state.isActive;
}

export function setResponderAccountActive<T extends ResponderDutyState>(
  state: T,
  isActive: boolean
): T {
  return {
    ...state,
    isActive,
    onDuty: isActive ? isResponderEffectivelyOnDuty(state) : false,
  };
}
