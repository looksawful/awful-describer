import type { Meta, StoryObj } from '@storybook/react-vite';
import DropZone from './DropZone';

const meta = {
  title: 'Desktop/Drop zone',
  component: DropZone,
  args: { children: <div style={{ border: '1px dashed #777', padding: 64, minWidth: 340, textAlign: 'center' }}>Drop image files here</div> },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof DropZone>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Idle: Story = {};
