// Minimal ambient module declarations for dnd-kit packages
// These are temporary shims to avoid TypeScript compile errors in environments
// where the actual packages or types haven't been installed yet.

declare module '@dnd-kit/core' {
  export const DndContext: any;
  export const closestCenter: any;
  export const PointerSensor: any;
  export function useSensor(...args: any[]): any;
  export function useSensors(...args: any[]): any;
  export type DragEndEvent = any;
  const _default: any;
  export default _default;
}

declare module '@dnd-kit/sortable' {
  export function arrayMove(list: any[], from: number, to: number): any[];
  export const SortableContext: any;
  export const horizontalListSortingStrategy: any;
  export function useSortable(...args: any[]): any;
  const _default: any;
  export default _default;
}

declare module '@dnd-kit/utilities' {
  export const CSS: any;
  const _default: any;
  export default _default;
}

declare module 'framer-motion' {
  export const AnimatePresence: any;
  export const MotionConfig: any;
  export const motion: any;
  export default motion;
}

declare module '@radix-ui/react-icons' {
  export const Cross2Icon: any;
  const _default: any;
  export default _default;
}

// Allow any @mui/icons-material/* imports (shallow ambient module)
declare module '@mui/icons-material/*' {
  const Icon: any;
  export default Icon;
}

