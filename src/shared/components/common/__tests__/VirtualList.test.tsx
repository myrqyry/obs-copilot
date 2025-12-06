// src/components/common/__tests__/VirtualList.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { VirtualList } from '../VirtualList';

vi.mock('react-virtualized-auto-sizer', () => ({
  __esModule: true,
  default: ({ children }) => children({ height: 500, width: 500 }),
}));

describe('VirtualList', () => {
  it('renders items correctly', () => {
    const items = [{ id: 1, text: 'Item 1' }, { id: 2, text: 'Item 2' }];
    const renderItem = (item: any) => <div>{item.text}</div>;

    render(
      <VirtualList
        items={items}
        itemHeight={50}
        renderItem={renderItem}
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('handles variable heights', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ id: i, text: `Item ${i}` }));
    const getHeight = (index: number) => index % 2 === 0 ? 50 : 100;

    render(
      <VirtualList
        items={items}
        itemHeight={getHeight}
        renderItem={(item) => <div>{item.text}</div>}
      />
    );

    // Should only render visible items
    expect(screen.queryAllByText(/Item \d+/).length).toBeLessThan(100);
  });
});
