import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, type EmitterSubscription } from 'react-native';

// Subscribe once per app, not once per media card in a large list.
let enabled = false;
let subscription: EmitterSubscription | undefined;
let requestGeneration = 0;
const listeners = new Set<() => void>();

function setEnabled(next: boolean) {
  if (enabled === next) return;
  enabled = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    const generation = ++requestGeneration;
    subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setEnabled);
    void AccessibilityInfo.isReduceTransparencyEnabled()
      .then((next) => {
        if (generation === requestGeneration) setEnabled(next);
      })
      .catch(() => {
        // On platforms without this accessibility query, use normal materials.
      });
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      ++requestGeneration;
      subscription?.remove();
      subscription = undefined;
    }
  };
}

function getSnapshot() {
  return enabled;
}

export function useReduceTransparency() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
