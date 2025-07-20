#include <obs-module.h>

OBS_DECLARE_MODULE()
OBS_MODULE_USE_DEFAULT_LOCALE("obs-copilot", "en-US")

extern struct obs_source_info copilot_source_info;
extern struct obs_service_info copilot_service_info;
extern void init_copilot_dock();

bool obs_module_load(void)
{
	obs_register_source(&copilot_source_info);
	obs_register_service(&copilot_service_info);
	init_copilot_dock();
	return true;
}
