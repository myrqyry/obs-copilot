#include "copilot-source.h"
#include <obs-module.h>
#include <graphics/gs-helper.h>
#include <obs-source.h>
#include <obs-data.h>

// ----------------------------------------------------------------
// obs_source_info callbacks

static const char *get_name(void *type_data)
{
	B3D_UNUSED_PARAMETER(type_data);
	return obs_module_text("Source.Name");
}

static void *create(obs_data_t *settings, obs_source_t *source)
{
	return new CopilotSource(source, settings);
}

static void destroy(void *data)
{
	delete static_cast<CopilotSource *>(data);
}

static void video_render(void *data, gs_effect_t *effect)
{
	static_cast<CopilotSource *>(data)->render(effect);
}

static uint32_t get_width(void *data)
{
	return static_cast<CopilotSource *>(data)->get_width();
}

static uint32_t get_height(void *data)
{
	return static_cast<CopilotSource *>(data)->get_height();
}

struct obs_source_info copilot_source_info = {
	.id = "copilot_content_source",
	.type = OBS_SOURCE_TYPE_INPUT,
	.output_flags = OBS_SOURCE_VIDEO,
	.get_name = get_name,
	.create = create,
	.destroy = destroy,
	.video_render = video_render,
	.get_width = get_width,
	.get_height = get_height,
	.get_properties = nullptr,
};

// ----------------------------------------------------------------
// CopilotSource implementation

CopilotSource::CopilotSource(obs_source_t *source, obs_data_t *settings)
	: source(source)
{
	// Initialize with default text
	text = "Hello, Copilot!";
}

CopilotSource::~CopilotSource() {}

void CopilotSource::render(gs_effect_t *effect)
{
	gs_color(GS_WHITE);
	gs_draw_text(font, text.c_str(), text.length(), GS_TEXT_DEFAULT);
}

uint32_t CopilotSource::get_width()
{
	return 1920;
}

uint32_t CopilotSource::get_height()
{
	return 1080;
}

void CopilotSource::update_text(const char *new_text)
{
	text = new_text;
	obs_source_media_updated(source);
}
