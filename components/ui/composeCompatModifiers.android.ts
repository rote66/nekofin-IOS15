import type { ExpoModifier } from '@expo/ui/jetpack-compose/modifiers';

type ComposeWindowPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** SDK57 Compose modifiers that were removed from the SDK55 JS surface. */
export function composeSemantics(contentDescription: string): ExpoModifier {
  return { $type: 'semantics', contentDescription };
}

export function composeOnGloballyPositioned(
  eventListener: (position: ComposeWindowPosition) => void,
): ExpoModifier {
  return { $type: 'onGloballyPositioned', eventListener };
}
