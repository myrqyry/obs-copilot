// src/components/common/VirtualList.tsx - Enhanced version
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import {
  FixedSizeList,
  ListChildComponentProps,
  VariableSizeList,
} from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

export interface VirtualListHandle {
  scrollToItem: (
    index: number,
    align?: 'start' | 'center' | 'end' | 'auto',
  ) => void;
  scrollTo: (scrollOffset: number) => void;
  scrollToBottom: () => void;
}

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  renderItem: (
    item: T,
    index: number,
    style: React.CSSProperties,
  ) => React.ReactNode;
  className?: string;
  overscanCount?: number;
  onScroll?: (
    scrollOffset: number,
    scrollUpdateWasRequested: boolean,
  ) => void;
}

export const VirtualList = forwardRef<VirtualListHandle, any>(
  (
    {
      items,
      itemHeight,
      renderItem,
      className = '',
      overscanCount = 5,
      onScroll,
    }: VirtualListProps<any>,
    ref,
  ) => {
    const isVariableSize = typeof itemHeight === 'function';
    const listRef = useRef<FixedSizeList | VariableSizeList>(null);

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      scrollToItem: (
        index: number,
        align: 'start' | 'center' | 'end' | 'auto' = 'auto',
      ) => {
        listRef.current?.scrollToItem(index, align);
      },
      scrollTo: (scrollOffset: number) => {
        listRef.current?.scrollTo(scrollOffset);
      },
      scrollToBottom: () => {
        if (items.length > 0) {
          listRef.current?.scrollToItem(items.length - 1, 'end');
        }
      },
    }));

    const Row = useMemo(
      () =>
        ({ index, style }: ListChildComponentProps) => (
          <div style={style}>{renderItem(items[index], index, style)}</div>
        ),
      [items, renderItem],
    );

    return (
      <div className={`h-full w-full ${className}`}>
        <AutoSizer>
          {({ height, width }) =>
            isVariableSize ? (
              <VariableSizeList
                ref={listRef as React.RefObject<VariableSizeList>}
                height={height}
                width={width}
                itemCount={items.length}
                itemSize={itemHeight as (index: number) => number}
                overscanCount={overscanCount}
                onScroll={({ scrollOffset, scrollUpdateWasRequested }) => {
                  onScroll?.(scrollOffset, scrollUpdateWasRequested);
                }}
              >
                {Row}
              </VariableSizeList>
            ) : (
              <FixedSizeList
                ref={listRef as React.RefObject<FixedSizeList>}
                height={height}
                width={width}
                itemCount={items.length}
                itemSize={itemHeight as number}
                overscanCount={overscanCount}
                onScroll={({ scrollOffset, scrollUpdateWasRequested }) => {
                  onScroll?.(scrollOffset, scrollUpdateWasRequested);
                }}
              >
                {Row}
              </FixedSizeList>
            )
          }
        </AutoSizer>
      </div>
    );
  },
);

VirtualList.displayName = 'VirtualList';
