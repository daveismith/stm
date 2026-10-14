import { render, screen } from '@testing-library/react';
import { renderWithRouter } from '../../../../tests/test-utils'
import CreateGame from '../CreateGame';

describe('CreateGame', () => {
  it('Renders Game Selection Screen', () => {
    renderWithRouter(<CreateGame />);

    //screen.debug();

    expect(screen.getByRole("heading", { name: "SHOOT THE MOON" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create 4 Player Game" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create 6 Player Game" })).toBeInTheDocument();
  });
});