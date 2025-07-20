#pragma once

#include <obs-frontend-api.h>
#include <QDockWidget>

class QTextBrowser;
class QTextEdit;
class QPushButton;
class QStatusBar;

class CopilotDock : public QDockWidget {
	Q_OBJECT

public:
	CopilotDock(QWidget *parent = nullptr);

public slots:
	void displayResponse(const QString &response, bool isError);

private slots:
	void onExecuteClicked();

private:
	QTextBrowser *responseDisplay;
	QTextEdit *commandInput;
	QPushButton *executeButton;
	QStatusBar *statusBar;
};
