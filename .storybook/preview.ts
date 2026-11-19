import type { Preview } from '@storybook/react-vite';
import '../src/renderer/styles/index.css';

const preview: Preview = { parameters: { controls: { expanded: true }, layout: 'centered' } };
export default preview;
