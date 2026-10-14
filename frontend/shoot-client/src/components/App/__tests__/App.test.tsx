import { render, screen } from '@testing-library/react';

import App from '../App';

describe('App', () => {
  it('Renders Intro Screen', () => {
    render(<App />);

    //screen.debug();

    expect(screen.getByRole("heading", { name: "SHOOT THE MOON" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create 4 Player Game" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create 6 Player Game" })).toBeInTheDocument();
  });
});