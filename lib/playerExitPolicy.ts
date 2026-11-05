/** Pure exit readiness policy; kept separate from native orientation imports for unit tests. */
export function canFinishPlayerExit({
  exitPrepared,
  coordinatePortraitExit,
  portraitTransitionCompleted,
  viewportIsPortrait,
}: {
  exitPrepared: boolean;
  coordinatePortraitExit: boolean;
  portraitTransitionCompleted: boolean;
  viewportIsPortrait: boolean;
}) {
  return (
    exitPrepared && (!coordinatePortraitExit || (portraitTransitionCompleted && viewportIsPortrait))
  );
}
