# Require a modern version of CMake
cmake_minimum_required(VERSION 3.16)

# Define the project name, which will be the base name for the output library
project(obs-copilot)

# Use the FindOBSStudio module provided by the OBS build system to locate
# necessary headers, libraries, and helper functions. This is the standard method.
find_package(OBSStudio REQUIRED)

# Define a variable containing all C++ source files for the plugin.
# This modular approach keeps the build script clean.
set(PLUGIN_SOURCES
    src/obs-copilot-plugin.cpp
    src/copilot-dock.cpp
    src/copilot-service.cpp
    src/copilot-source.cpp
)

# Create the plugin library. 'MODULE' specifies that this is a dynamically
# loadable module (e.g., a.dll,.so, or.plugin).
add_library(obs-copilot MODULE ${PLUGIN_SOURCES})

# Link the plugin against its dependencies.
# - libobs: The core OBS library, required by all plugins.
# - Qt6::Widgets: The Qt Widgets library, required for creating the custom UI dock.
#   Note: The exact Qt target name may vary (e.g., Qt5::Widgets) depending on the OBS version.
#   The agent should assume Qt6 as the modern standard.
target_link_libraries(obs-copilot PRIVATE libobs Qt6::Widgets)

# Use the OBS helper function to define installation rules. This ensures that
# the compiled plugin and its associated data files (like locales) are placed
# in the correct directory structure for OBS to find them.
install_obs_plugin_with_data(obs-copilot data)
