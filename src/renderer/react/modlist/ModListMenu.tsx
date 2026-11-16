import { useModListMenuContext } from 'renderer/react/modlist/context/ModListMenuContext';
import { useCallback } from 'react';
import { Menu } from '@mui/material';

type Props = {
  children: React.ReactNode;
};

// While a menu is open, an invisible backdrop covers the window, so a
// right-click on another mod would only hit the backdrop and do nothing.
// Close this menu and pass the right-click on to whatever lies underneath,
// so that mod's menu opens instead (or this one moves to the new spot).
export function forwardContextMenuThroughBackdrop(
  event: React.MouseEvent<HTMLElement>,
  onClose: () => void,
): void {
  event.preventDefault();
  const { clientX, clientY } = event;
  const backdrop = event.currentTarget;
  const modalRoot = backdrop.parentElement ?? backdrop;
  onClose();
  const target = document
    .elementsFromPoint(clientX, clientY)
    .find((element) => element !== modalRoot && !modalRoot.contains(element));
  target?.dispatchEvent(
    new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      button: 2,
      buttons: 0,
      clientX,
      clientY,
    }),
  );
}

export default function ModListMenu({ children }: Props) {
  const { contextMenuAnchor, onCloseContextMenu } = useModListMenuContext();

  const onBackdropContextMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>) =>
      forwardContextMenuThroughBackdrop(event, onCloseContextMenu),
    [onCloseContextMenu],
  );

  return (
    <Menu
      anchorPosition={contextMenuAnchor ?? undefined}
      anchorReference="anchorPosition"
      BackdropProps={{ onContextMenu: onBackdropContextMenu }}
      onClose={onCloseContextMenu}
      open={contextMenuAnchor != null}
    >
      {children}
    </Menu>
  );
}
