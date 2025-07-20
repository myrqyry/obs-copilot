# OBS-Copilot

AI assistant for OBS Studio.

## Features

*   **Dockable Control Panel:** A user-friendly dock for interacting with the AI service.
*   **AI Service Integration:** Connects to a powerful AI backend to process natural language commands.
*   **Dynamic Content Source:** Render AI-generated content directly into your OBS scenes.

## Build Instructions

1.  **Set up the OBS Studio development environment.** Follow the official OBS Studio build instructions for your operating system:
    *   [Windows](https://obsproject.com/wiki/build-instructions-for-windows)
    *   [macOS](https://obsproject.com/wiki/build-instructions-for-mac)
    *   [Linux](https://obsproject.com/wiki/build-instructions-for-linux)

2.  **Build the plugin.** Use CMake to build the plugin:

    ```bash
    mkdir build
    cd build
    cmake ..
    make -j
    ```

## Installation

Copy the compiled plugin binary (e.g., `obs-copilot.dll`, `obs-copilot.so`, or `obs-copilot.plugin`) and the `data` folder to your OBS Studio plugin directory.

## Usage

1.  Open the "OBS-Copilot Control" dock from the "Docks" menu.
2.  Go to OBS Settings -> Stream and select "OBS-Copilot Service".
3.  Enter your AI API key in the service settings.
4.  Add the "Copilot Content" source to a scene.
5.  Execute a command in the control dock, for example: "display text: Hello, world!"

## Manual Test Plan

### Test Case 1: Plugin Loading and Registration

*   **Steps:**
    1.  Install the plugin.
    2.  Start OBS Studio.
    3.  Check the OBS log file.
*   **Expected Result:**
    *   OBS Studio starts without errors or crashes.
    *   The log file contains entries indicating that the "obs-copilot" module was loaded successfully and that its custom service and source were registered.

### Test Case 2: Dock Functionality and UI Integrity

*   **Steps:**
    1.  In OBS, navigate to the "Docks" menu.
    2.  Select "OBS-Copilot Control".
    3.  Inspect the dock.
*   **Expected Result:**
    *   The dock appears and can be moved and resized.
    *   It contains a response display area, a command input box, an "Execute" button, and a status bar. All elements are correctly laid out.

### Test Case 3: Service Configuration and Persistence

*   **Steps:**
    1.  Go to OBS Settings -> Stream.
    2.  Select "OBS-Copilot Service" from the service dropdown.
    3.  Enter a dummy API key into the settings property.
    4.  Click Apply/OK.
    5.  Close and restart OBS.
    6.  Re-open the settings.
*   **Expected Result:**
    *   The settings UI for the service appears correctly.
    *   The entered API key is saved and persists after restarting OBS.

### Test Case 4: End-to-End Command-Response Loop

*   **Steps:**
    1.  Open the control dock.
    2.  Type a simple command into the input box.
    3.  Click the "Execute" button.
*   **Expected Result:**
    *   The status bar immediately changes to "Processing...".
    *   After a short delay, the status bar changes to "Ready" and a response from the AI appears in the response display area.

### Test Case 5: Dynamic Source Functionality

*   **Steps:**
    1.  Create a new scene.
    2.  Add a new source and select "Copilot Content".
    3.  Place the source in the scene.
    4.  Use the control dock to execute a command that should update the source (e.g., "display text: Verification Successful").
*   **Expected Result:**
    *   The "Copilot Content" source appears in the scene.
    *   After the command is executed, the content rendered by the source updates in real-time to reflect the AI's output.
