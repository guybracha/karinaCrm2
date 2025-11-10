import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Karina CRM header', () => {
  render(<App />);
  const header = screen.getByText(/Karina CRM/i);
  expect(header).toBeInTheDocument();
});
