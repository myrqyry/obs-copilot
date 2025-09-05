# OBS Control Panel — Slider and Knob Plan

## Summary

- Purpose: add Slider and Knob presentational primitives and an integration plan to expose continuous OBS controls (volume, filter params, transforms) in the existing OBS control UI.
- Deliverable: analysis-only plan document (this file). Implementation will follow after plan sign-off.

## Goals

- Add two presentational primitives under [`src/components/ui/`](src/components/ui/:1): [`src/components/ui/Slider.tsx`](src/components/ui/Slider.tsx:1) and [`src/components/ui/Knob.tsx`](src/components/ui/Knob.tsx:1).
- Define typed props in [`src/types/ui.ts`](src/types/ui.ts:1) (or extend [`src/types/obs.ts`](src/types/obs.ts:1)).
- Integrate controls into widgets via [`ObsWidget`](src/plugins/core/ObsWidget.tsx:1) or by adding a new feature module [`src/features/obs-control/`](src/features/obs-control/:1).
- Wire controls to existing OBS APIs via [`src/hooks/useObsActions.ts`](src/hooks/useObsActions.ts:1) and [`src/services/obsClient.ts`](src/services/obsClient.ts:1).
- Provide unit tests and Storybook stories for primitives.

## Proposed file structure

- [`src/components/ui/Slider.tsx`](src/components/ui/Slider.tsx:1)
- [`src/components/ui/Knob.tsx`](src/components/ui/Knob.tsx:1)
- [`src/types/ui.ts`](src/types/ui.ts:1) (new)
- [`src/features/obs-control/index.tsx`](src/features/obs-control/index.tsx:1) (new feature module)
- [`src/features/obs-control/SliderWidget.tsx`](src/features/obs-control/SliderWidget.tsx:1)
- [`src/features/obs-control/KnobWidget.tsx`](src/features/obs-control/KnobWidget.tsx:1)
- Update or add: [`src/plugins/core/ObsWidget.tsx`](src/plugins/core/ObsWidget.tsx:1) (render control widgets when config contains control metadata)
- Update modal: [`src/plugins/core/ObsWidgetConfigModal.tsx`](src/plugins/core/ObsWidgetConfigModal.tsx:1) (add control config options)

## Files to modify (summary)

- Add: [`src/components/ui/Slider.tsx`](src/components/ui/Slider.tsx:1)
- Add: [`src/components/ui/Knob.tsx`](src/components/ui/Knob.tsx:1)
- Add: [`src/types/ui.ts`](src/types/ui.ts:1) or extend [`src/types/obs.ts`](src/types/obs.ts:1)
- Add: [`src/features/obs-control/`] feature widgets and index
- Update: [`src/plugins/core/ObsWidget.tsx`](src/plugins/core/ObsWidget.tsx:1) or map control widgets in [`src/plugins/core/NewObsStudioTab.tsx`](src/plugins/core/NewObsStudioTab.tsx:1)
- Update: [`src/plugins/core/ObsWidgetConfigModal.tsx`](src/plugins/core/ObsWidgetConfigModal.tsx:1) to allow creating control-based widgets
- Use: [`src/hooks/useObsActions.ts`](src/hooks/useObsActions.ts:1) and [`src/services/obsClient.ts`](src/services/obsClient.ts:1) for concrete OBS calls
- Add tests under: [`src/components/ui/__tests__/`](src/components/ui/__tests__/Slider.test.tsx:1)

## Component API proposals

```typescript
// TypeScript
export type SliderProps = {
  id?: string;
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  onChangeEnd?: (v: number) => void;
  disabled?: boolean;
  className?: string;
};
```

```typescript
// TypeScript
export type KnobProps = {
  id?: string;
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  onChangeEnd?: (v: number) => void;
  size?: number; // px
  disabled?: boolean;
  className?: string;
};
```

Add control metadata / types (suggested new file [`src/types/ui.ts`](src/types/ui.ts:1)):

```typescript
// TypeScript
export type ControlKind = 'slider' | 'knob';
export interface ObsControlConfig {
  kind: ControlKind;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  // mapping to OBS parameter
  sourceName?: string;
  property?: string; // e.g., filterName or input setting key
}
```

Recommendation: extend [`ObsWidgetConfig`](src/types/obs.ts:1) to include `control?: ObsControlConfig` so `NewObsStudioTab` and `ObsWidget` can create and render control widgets.

## Integration strategy

1. Rendering
   - Preferred (Option A): Extend [`ObsWidgetConfig`](src/types/obs.ts:1) with optional `control` and update [`src/plugins/core/ObsWidget.tsx`](src/plugins/core/ObsWidget.tsx:1) to render `SliderWidget` or `KnobWidget` when `config.control` is present.
   - Alternative (Option B): Keep ObsWidget unchanged and add a new feature module [`src/features/obs-control/`](src/features/obs-control/:1) that NewObsStudioTab maps to controls by widget type.

2. Wiring
   - Reuse and extend [`src/hooks/useObsActions.ts`](src/hooks/useObsActions.ts:1) with helpers:
     - setInputVolume(sourceName, value)
     - setSourceFilterFloatProperty(sourceName, filterName, property, value)
     - setSceneItemTransform(sceneName, itemIndex, { scaleX, scaleY })
   - UI primitives (Slider/Knob) call `onChange` frequently for responsiveness; debounce inside widget or hook to avoid overloading the OBS socket. Use `onChangeEnd` for committing final value when needed.

3. State
   - Keep Slider/Knob controlled locally for immediate UI responsiveness.
   - Optionally persist last-used values in a slim Zustand slice (e.g., [`src/store/obsControlStore.ts`](src/store/obsControlStore.ts:1)) for cross-tab state and restoration.

4. Validation and safety
   - Validate control ranges in modal and clamp values client-side.
   - Ensure type-safety by adding new types in [`src/types/ui.ts`](src/types/ui.ts:1).

## Modal and config changes

- Update [`src/plugins/core/ObsWidgetConfigModal.tsx`](src/plugins/core/ObsWidgetConfigModal.tsx:1) to:
  - Expose controls when the selected action supports continuous values.
  - Allow selecting control kind (slider/knob), min, max, step, and map to `sourceName` and `property` (e.g., filter name or input setting path).

## Tests and stories

- Unit tests:
  - [`src/components/ui/__tests__/Slider.test.tsx`](src/components/ui/__tests__/Slider.test.tsx:1) — rendering, onChange, onChangeEnd, disabled.
  - [`src/components/ui/__tests__/Knob.test.tsx`](src/components/ui/__tests__/Knob.test.tsx:1) — same.
- Integration tests:
  - `src/features/obs-control/__tests__/SliderWidget.integration.test.tsx` — mock obsClient / useObsActions and assert correct calls.
- Storybook:
  - Add `src/components/ui/Slider.stories.tsx` and `src/components/ui/Knob.stories.tsx` showing sizes, ranges, and disabled behavior.

## Migration and compatibility

- Adding optional `control` to [`ObsWidgetConfig`](src/types/obs.ts:1) is backward-compatible — existing widgets render unchanged.
- Keep `toggle_mute` and `switch_scene` behavior unchanged; make continuous controls opt-in.

## Implementation sequence (high level)

1. Create [`src/types/ui.ts`](src/types/ui.ts:1) and add control types.
2. Implement presentational primitives [`src/components/ui/Slider.tsx`](src/components/ui/Slider.tsx:1) and [`src/components/ui/Knob.tsx`](src/components/ui/Knob.tsx:1) with controlled props and tests/stories.
3. Add feature widgets [`src/features/obs-control/SliderWidget.tsx`](src/features/obs-control/SliderWidget.tsx:1) and [`KnobWidget.tsx`](src/features/obs-control/KnobWidget.tsx:1) that map control UI -> useObsActions calls.
4. Extend [`src/plugins/core/ObsWidget.tsx`](src/plugins/core/ObsWidget.tsx:1) (or `NewObsStudioTab`) to render control widgets based on `config.control`.
5. Add/extend helpers in [`src/hooks/useObsActions.ts`](src/hooks/useObsActions.ts:1) and add integration tests.
6. Update [`src/plugins/core/ObsWidgetConfigModal.tsx`](src/plugins/core/ObsWidgetConfigModal.tsx:1) to allow creating control widgets.
7. Add stories, run linting and tests, open PR.

## PR checklist

- [ ] New components in `src/components/ui/` with tests and stories.
- [ ] New/updated types in `src/types/`.
- [ ] Feature wiring in `src/features/obs-control/` or updated `ObsWidget`.
- [ ] New useObsActions helpers and tests.
- [ ] Modal updates to create control widgets.
- [ ] CHANGELOG entry and migration notes.
- [ ] Run lint and unit tests; satisfy TypeScript strict mode.

## Open questions

- Prefer Option A (extend ObsWidget) or Option B (new feature folder)? Recommendation: Option A for minimal surface area and reuse of the existing widget modal.
- Which OBS parameters should be prioritized for controls? Suggested priority: input volume, filter float parameters, scene item transform scale X/Y.

## Next action (if you approve)

- Write this plan to [`obs-control-panel-plan.md`](obs-control-panel-plan.md:1) (done).
- Update the todo list to mark planning complete and prepare to switch to code mode to implement.

End.