### OBS Control Panel Enhancement Plan

**Goal:** Integrate and configure existing `SliderWidget` and `KnobWidget` components into the OBS control panel to allow dynamic control of OBS properties.

#### 1. Current State Analysis

*   **`NewObsStudioTab.tsx`**: The main OBS control panel. It uses `react-grid-layout` to display various `ObsWidget` components. It also includes `ObsWidgetConfigModal` for adding new widgets.
*   **`ObsWidgetConfigModal.tsx`**: A modal for configuring and adding new OBS widgets. Currently, it allows adding action-based widgets (e.g., toggle mute, switch scene).
*   **`ObsWidget.tsx`**: A wrapper component that receives an `ObsWidgetConfig` and renders the appropriate child component (`SliderWidget`, `KnobWidget`, or a `Button` for action-based widgets) based on the `config.control` property or `config.type`.
*   **`SliderWidget.tsx` / `KnobWidget.tsx`**: Existing components designed to control OBS properties. They utilize `ObsControlConfig` for their specific settings (min, max, step, sourceName, property, sendMethod, etc.). They handle OBS connection status and debounced value sending.
*   **`src/types/obs.ts`**: Defines the `ObsWidgetConfig` and `ObsControlConfig` interfaces, which are crucial for configuring the widgets.

#### 2. Proposed Changes

The primary focus will be on enhancing the `ObsWidgetConfigModal` to allow users to create and configure "control" widgets (sliders and knobs) and ensuring `ObsWidget` correctly renders them.

**2.1. Enhance `ObsWidgetConfigModal.tsx`**

*   **Objective:** Modify the modal to allow users to select "slider" or "knob" as a widget type and provide inputs for `ObsControlConfig` properties.
*   **Details:**
    *   Add a new selection for `control.kind` (e.g., a radio button or dropdown) to choose between "Action", "Slider", or "Knob".
    *   Conditionally render input fields based on the selected `kind`:
        *   If "Action" is selected, show existing inputs for `type`, `sceneName`, `sourceName`.
        *   If "Slider" or "Knob" is selected, show inputs for:
            *   `sourceName`: OBS source to control (e.g., "Mic/Aux").
            *   `property`: The specific OBS property (e.g., "volume_db", "gain").
            *   `sendMethod`: The OBS WebSocket method to call (e.g., "SetInputVolume", "SetInputSettings").
            *   `min`, `max`, `step`: Numerical range and increment for the slider/knob.
            *   `unit`: Optional unit (e.g., "dB", "%").
            *   `debounceMs`, `throttleMs`: Optional timing controls.
    *   Ensure the `onSave` callback correctly constructs an `ObsWidgetConfig` object with the `control` property populated.

**2.2. Review and potentially refine `src/types/obs.ts`**

*   **Objective:** Verify that `ObsWidgetConfig` and `ObsControlConfig` adequately support the enhanced configuration needs.
*   **Details:**
    *   Confirm that the `ObsWidgetConfig` can effectively differentiate between action-based widgets and control-based widgets. The current structure with an optional `control` property seems sufficient.
    *   No immediate changes seem required for `ObsControlConfig`, as it already covers the necessary properties for sliders and knobs.
    *   Consider adding a new `type` to `ObsActionType` to explicitly denote a control widget, or rely solely on the presence of the `control` object. For now, relying on `control` object presence is cleaner.

**2.3. Minor adjustments to `SliderWidget.tsx` / `KnobWidget.tsx` (Future)**

*   **Objective:** Address the `TODO` for initial value fetching.
*   **Details:** This is a stretch goal and not strictly necessary for the initial implementation. It would involve calling specific OBS getter methods (e.g., `GetInputVolume` for `volume_db`) to initialize the widget's value from OBS. This can be deferred to a separate task if needed.

#### 3. New File Structure (Minimal)

*   No new top-level component files are needed beyond the existing ones.
*   Any new UI elements for the `ObsWidgetConfigModal` (e.g., custom form inputs if existing `ui` components are insufficient) should ideally go into `src/components/ui/`.

#### 4. Component Props

*   **`ObsWidgetConfigModal`**: Will need access to `scenes` and `sources` (already has this) to populate dropdowns for `sourceName`.
*   **`ObsWidget`**: Already receives `ObsWidgetConfig`.
*   **`SliderWidget` / `KnobWidget`**: Already receive `config: ObsWidgetConfig`.

#### 5. Integration Workflow (Mermaid Diagram)

```mermaid
graph TD
    A[NewObsStudioTab] --> B{Add Widget Button Click}
    B --> C[ObsWidgetConfigModal]
    C --> D{User Configures Widget}
    D -- if Action --> E[Creates Action ObsWidgetConfig]
    D -- if Slider/Knob --> F[Creates Control ObsWidgetConfig]
    E --> G[NewObsStudioTab.handleAddWidget]
    F --> G
    G --> H{Update widgets state and layout}
    H --> I[ReactGridLayout renders ObsWidget]
    I --> J{ObsWidget evaluates config.control}
    J -- if control.kind = 'slider' --> K[Renders SliderWidget]
    J -- if control.kind = 'knob' --> L[Renders KnobWidget]
    K --> M[SliderWidget sends value to OBS]
    L --> N[KnobWidget sends value to OBS]