declare module '@imgly/background-removal';
declare module '@xenova/transformers';
declare module 'react-grid-layout' {
	import * as React from 'react';
	export interface LayoutItem {
		i: string;
		x: number;
		y: number;
		w: number;
		h: number;
		static?: boolean;
		isResizable?: boolean;
		isDraggable?: boolean;
		minW?: number;
		maxW?: number;
		minH?: number;
		maxH?: number;
	}
	export type Layout = LayoutItem[];
	export interface ReactGridLayoutProps {
		className?: string;
		layout: Layout;
		cols?: number;
		rowHeight?: number;
		onLayoutChange?: (layout: Layout) => void;
		children?: React.ReactNode;
	}
	export default class GridLayout extends React.Component<ReactGridLayoutProps> {}
	export function WidthProvider<T>(component: T): T;
}
