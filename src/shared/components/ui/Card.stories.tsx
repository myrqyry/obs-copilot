import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardBadge } from './Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'glass',
        'elevated',
        'outlined',
        'gradient',
        'neon',
        'frosted',
        'minimal',
        'accent-gradient',
        'accent-outline',
        'primary-glow',
      ],
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    hover: { control: 'boolean' },
    glow: { control: 'boolean' },
    interactive: { control: 'boolean' },
    withAnimation: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description goes here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main content of the card.</p>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">Footer content</p>
        </CardFooter>
      </>
    ),
  },
};

export const Glass: Story = {
  args: {
    ...Default.args,
    variant: 'glass',
  },
};

export const Neon: Story = {
    args: {
      ...Default.args,
      variant: 'neon',
    },
  };
export const WithBadge: Story = {
    render: (args) => (
        <Card {...args}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Badged Card</CardTitle>
                        <CardDescription>With status indicator</CardDescription>
                    </div>
                    <CardBadge variant="success">Active</CardBadge>
                </div>
            </CardHeader>
            <CardContent>
                <p>Card content with badge in header.</p>
            </CardContent>
        </Card>
    ),
    args: {
        variant: 'elevated'
    }
}
