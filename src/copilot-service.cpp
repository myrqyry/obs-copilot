#include "copilot-service.h"

#include <obs-module.h>

// ----------------------------------------------------------------
// obs_service_info callbacks

static const char *get_name(void *type_data)
{
	B3D_UNUSED_PARAMETER(type_data);
	return obs_module_text("Service.Name");
}

static void *create(obs_data_t *settings, obs_service_t *service)
{
	return new CopilotService(service, settings);
}

static void destroy(void *data)
{
	delete static_cast<CopilotService *>(data);
}

static void update(void *data, obs_data_t *settings)
{
	static_cast<CopilotService *>(data)->update(settings);
}

static obs_properties_t *get_properties(void *data)
{
	B3D_UNUSED_PARAMETER(data);
	obs_properties_t *props = obs_properties_create();
	obs_properties_add_text(props, "api_key", obs_module_text("APIKey"),
				OBS_TEXT_PASSWORD);
	return props;
}

struct obs_service_info copilot_service_info = {
	.id = "obs_copilot_service",
	.get_name = get_name,
	.create = create,
	.destroy = destroy,
	.update = update,
	.get_properties = get_properties,
	.apply_encoder_settings = nullptr,
	.get_url = nullptr,
	.get_key = nullptr,
};

// ----------------------------------------------------------------
// CopilotService implementation

CopilotService::CopilotService(obs_service_t *service, obs_data_t *settings)
	: service(service)
{
	update(settings);
}

CopilotService::~CopilotService() {}

void CopilotService::update(obs_data_t *settings)
{
	const char *api_key = obs_data_get_string(settings, "api_key");
	// Store the API key and re-initialize any network clients
}
