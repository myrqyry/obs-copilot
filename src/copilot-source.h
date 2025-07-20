#pragma once

#include <obs-source.h>
#include <string>
#include <graphics/gs_font.h>

class CopilotSource {
public:
	CopilotSource(obs_source_t *source, obs_data_t *settings);
	~CopilotSource();

	void render(gs_effect_t *effect);
	uint32_t get_width();
	uint32_t get_height();

	void update_text(const char *new_text);

private:
	obs_source_t *source;
	std::string text;
	gs_font_t *font;
};
