import { logger } from '@/shared/utils/logger';
import { useWidgetStore } from '@/app/store/widgetsStore';

export class ConflictResolver {
  static resolveWidgetConflict(widgetId1: string, widgetId2: string, property: string, newValue: any) {
    const store = useWidgetStore.getState();
    const widget1 = store.widgets[widgetId1];
    const widget2 = store.widgets[widgetId2];

    if (!widget1 || !widget2) {
      logger.warn('One or both widgets not found for conflict resolution');
      return newValue;
    }

    // Simple resolution: last update wins, or based on priority if defined
    const priority1 = widget1.priority || 0;
    const priority2 = widget2.priority || 0;

    if (priority1 > priority2) {
      logger.info(`Widget ${widgetId1} has higher priority (${priority1} > ${priority2}), keeping its value`);
      return widget1.state[property] || newValue;
    } else if (priority2 > priority1) {
      logger.info(`Widget ${widgetId2} has higher priority (${priority2} > ${priority1}), keeping its value`);
      return widget2.state[property] || newValue;
    } else {
      // Default: keep new value or average if numeric
      if (typeof newValue === 'number') {
        const current1 = widget1.state[property] || 0;
        const current2 = widget2.state[property] || 0;
        const average = (current1 + current2) / 2;
        logger.info(`Equal priority, averaging values: ${current1} and ${current2} to ${average}`);
        return average;
      } else {
        // For non-numeric, keep new value
        logger.info(`Equal priority, using new value for property ${property}`);
        return newValue;
      }
    }
  }

  static resolveStateConflict(property: string, newValue: any, oldValue: any): any {
    // Resolve conflicts in state, e.g., if multiple updates come in
    if (oldValue === undefined) {
      return newValue;
    }

    // For volume, clamp to range
    if (property.includes('volume')) {
      const clamped = Math.max(-60, Math.min(0, newValue));
      logger.info(`Resolving volume conflict, clamping to ${clamped}`);
      return clamped;
    }

    // For boolean, use new value
    if (typeof newValue === 'boolean') {
      logger.info(`Resolving boolean conflict for ${property}, using new value: ${newValue}`);
      return newValue;
    }

    // Default: use new value
    return newValue;
  }

  // Resolve conflicts for multiple widgets affecting the same OBS property
  static resolveMultiWidgetConflict(property: string, widgets: string[], newValue: any) {
    if (widgets.length === 0) return newValue;

    // Get priorities
    const priorities = widgets.map(w => useWidgetStore.getState().widgets[w]?.priority || 0);
    const maxPriorityIndex = priorities.indexOf(Math.max(...priorities));
    const winningWidget = widgets[maxPriorityIndex];

    logger.info(`Resolving multi-widget conflict for ${property}, winner: ${winningWidget}`);
    // Could fetch from store or use newValue
    return newValue;
  }
}