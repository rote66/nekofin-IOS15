import {
  beginNavigationTransition,
  finishNavigationScope,
  finishNavigationTransition,
} from '@/lib/navigationWork';
import { usePerformanceStackScreenListeners } from '@/lib/performance/PerformanceMonitorContext';
import { useCallback } from 'react';

export function useNativeStackScreenListeners(scope: string, onTransitionFinish?: () => void) {
  const performanceListeners = usePerformanceStackScreenListeners(scope);
  return useCallback(
    (props: Parameters<typeof performanceListeners>[0] & { route: { key?: string } }) => {
      const listeners = performanceListeners(props);
      const key = `${scope}:${props.route.key ?? props.route.name}`;
      return {
        transitionStart(event: Parameters<typeof listeners.transitionStart>[0]) {
          beginNavigationTransition(key);
          listeners.transitionStart(event);
        },
        transitionEnd(event: Parameters<typeof listeners.transitionEnd>[0]) {
          finishNavigationTransition(key);
          listeners.transitionEnd(event);
          if (!event.data.closing) {
            finishNavigationScope(scope);
            onTransitionFinish?.();
          }
        },
        gestureCancel() {
          finishNavigationTransition(key);
          finishNavigationScope(scope);
          listeners.gestureCancel();
          onTransitionFinish?.();
        },
      };
    },
    [onTransitionFinish, performanceListeners, scope],
  );
}
