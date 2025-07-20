#include "copilot-dock.h"
#include "copilot-service.h"

#include <obs-module.h>

#include <QVBoxLayout>
#include <QTextBrowser>
#include <QTextEdit>
#include <QPushButton>
#include <QStatusBar>

// This is a global instance of the dock.
static CopilotDock *copilotDock = nullptr;

CopilotDock::CopilotDock(QWidget *parent) : QDockWidget(parent)
{
	setWindowTitle(obs_module_text("Dock.Title"));

	QWidget *widget = new QWidget;
	QVBoxLayout *layout = new QVBoxLayout;

	responseDisplay = new QTextBrowser;
	responseDisplay->setReadOnly(true);

	commandInput = new QTextEdit;
	executeButton = new QPushButton(obs_module_text("Dock.ExecuteButton"));
	statusBar = new QStatusBar;

	layout->addWidget(responseDisplay);
	layout->addWidget(commandInput);
	layout->addWidget(executeButton);
	layout->addWidget(statusBar);

	widget->setLayout(layout);
	setWidget(widget);

	connect(executeButton, &QPushButton::clicked, this,
		&CopilotDock::onExecuteClicked);

	statusBar->showMessage(obs_module_text("Dock.StatusReady"));
}

void CopilotDock::displayResponse(const QString &response, bool isError)
{
	responseDisplay->append(response);
	statusBar->showMessage(
		obs_module_text(isError ? "Dock.StatusError" : "Dock.StatusReady"));
}

void CopilotDock::onExecuteClicked()
{
	QString command = commandInput->toPlainText();
	commandInput->clear();
	statusBar->showMessage(obs_module_text("Dock.StatusProcessing"));

	// This is where we would call the service to execute the command.
	// For now, we'll just simulate a response.
	displayResponse("Command executed: " + command, false);
}

void init_copilot_dock()
{
	copilotDock = new CopilotDock;
	obs_frontend_add_dock(copilotDock);
}
