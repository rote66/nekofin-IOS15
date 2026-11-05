import { describe, expect, it } from 'vitest';

import { canFinishPlayerExit } from './playerExitPolicy';

describe('player exit orientation coordination', () => {
  it('waits for both the portrait event and portrait viewport on iPhone', () => {
    expect(
      canFinishPlayerExit({
        exitPrepared: true,
        coordinatePortraitExit: true,
        portraitTransitionCompleted: true,
        viewportIsPortrait: false,
      }),
    ).toBe(false);
    expect(
      canFinishPlayerExit({
        exitPrepared: true,
        coordinatePortraitExit: true,
        portraitTransitionCompleted: true,
        viewportIsPortrait: true,
      }),
    ).toBe(true);
  });

  it('does not wait for portrait rotation on iPad or non-iOS platforms', () => {
    expect(
      canFinishPlayerExit({
        exitPrepared: true,
        coordinatePortraitExit: false,
        portraitTransitionCompleted: false,
        viewportIsPortrait: false,
      }),
    ).toBe(true);
  });

  it('still waits for Android native exit preparation', () => {
    expect(
      canFinishPlayerExit({
        exitPrepared: false,
        coordinatePortraitExit: false,
        portraitTransitionCompleted: false,
        viewportIsPortrait: false,
      }),
    ).toBe(false);
  });
});
