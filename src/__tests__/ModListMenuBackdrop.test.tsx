import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ModListMenu from '../renderer/react/modlist/ModListMenu';
import {
  MenuListMenuContextProvider,
  useModListMenuContext,
} from '../renderer/react/modlist/context/ModListMenuContext';
import { MenuItem } from '@mui/material';

function Row({ name }: { name: string }) {
  const { onOpenContextMenu } = useModListMenuContext();
  return (
    <div data-testid={`row-${name}`} onContextMenu={onOpenContextMenu}>
      {name}
    </div>
  );
}

function ModRow({ name }: { name: string }) {
  return (
    <MenuListMenuContextProvider>
      <Row name={name} />
      <ModListMenu>
        <MenuItem>{`menu ${name}`}</MenuItem>
      </ModListMenu>
    </MenuListMenuContextProvider>
  );
}

describe('ModListMenu backdrop', () => {
  const original = document.elementsFromPoint;
  afterEach(() => {
    document.elementsFromPoint = original;
  });

  it('opens the menu of the mod right-clicked through an open menu', async () => {
    render(
      <>
        <ModRow name="A" />
        <ModRow name="B" />
      </>,
    );
    fireEvent.contextMenu(screen.getByTestId('row-A'), { clientX: 10, clientY: 10 });
    expect(await screen.findByText('menu A')).toBeTruthy();

    // jsdom has no layout: the element under the backdrop is row B
    const backdrop = document.querySelector('.MuiBackdrop-root') as HTMLElement;
    const modalRoot = backdrop.parentElement as HTMLElement;
    document.elementsFromPoint = jest.fn(() => [
      backdrop,
      modalRoot,
      screen.getByTestId('row-B'),
      document.body,
    ]);
    fireEvent.contextMenu(backdrop, { clientX: 10, clientY: 40 });

    expect(await screen.findByText('menu B')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('menu A')).toBeNull());
  });

  it('moves the same mod menu when it is right-clicked again', async () => {
    render(<ModRow name="A" />);
    fireEvent.contextMenu(screen.getByTestId('row-A'), { clientX: 10, clientY: 10 });
    expect(await screen.findByText('menu A')).toBeTruthy();
    const backdrop = document.querySelector('.MuiBackdrop-root') as HTMLElement;
    document.elementsFromPoint = jest.fn(() => [
      backdrop,
      backdrop.parentElement as HTMLElement,
      screen.getByTestId('row-A'),
    ]);
    fireEvent.contextMenu(backdrop, { clientX: 50, clientY: 60 });
    await waitFor(() => {
      const paper = document.querySelector('.MuiMenu-paper') as HTMLElement;
      expect(paper.style.top).toBe('54px');
      expect(paper.style.left).toBe('52px');
    });
  });
});
