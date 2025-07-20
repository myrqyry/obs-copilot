#pragma once

#include <obs-service.h>

class CopilotService {
public:
	CopilotService(obs_service_t *service, obs_data_t *settings);
	~CopilotService();

	void update(obs_data_t *settings);

private:
	obs_service_t *service;
};
