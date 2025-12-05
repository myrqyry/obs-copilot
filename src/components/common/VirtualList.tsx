// src/components/common/VirtualList.tsx
import { FixedSizeList, ListChildComponentProps, VariableSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { memo, forwardRef, useMemo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

export const VirtualList = memo(<T,>({
  items,
  itemHeight,
  renderItem,
  className = '',
  overscanCount = 5,
}: VirtualListProps<T>) => {
  const isVariableSize = typeof itemHeight === 'function';

  const Row = useMemo(
    () =>
      ({ index, style }: ListChildComponentProps) => (
        <div style={style}>{renderItem(items[index], index, style)}</div>
      ),
    [items, renderItem]
  );

  return (
    <div className={`h-full w-full ${className}`}>
      <AutoSizer>
        {({ height, width }) =>
          isVariableSize ? (
            <VariableSizeList
              height={height}
              width={width}
              itemCount={items.length}
              itemSize={itemHeight as (index: number) => number}
              overscanCount={overscanCount}
            >
              {Row}
            </VariableSizeList>
          ) : (
            <FixedSizeList
              height={height}
              width={width}
              itemCount={items.length}
              itemSize={itemHeight as number}
              overscanCount={overscanCount}
            >
              {Row}
            </FixedSizeList>
          )
        }
      </AutoSizer>
    </div>
  );
}) as <T>(props: VirtualListProps<T>) => JSX.Element;

VirtualList.displayName = 'VirtualList';
