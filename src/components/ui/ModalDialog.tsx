import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

type ModalDialogProps = {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  canClose?: boolean;
  children: ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
  onRequestClose: () => void;
  /** Set `maxWidth` here, not as a class: the viewport cap below is inline and would override it. */
  style?: CSSProperties;
};

export const ModalDialog = ({
  canClose = true,
  children,
  className = '',
  closeOnBackdrop = true,
  onRequestClose,
  style,
  ...accessibleName
}: ModalDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');

    return () => {
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
    };
  }, []);

  const requestClose = () => {
    if (canClose) onRequestClose();
  };

  return (
    <dialog
      {...accessibleName}
      // Merged, not concatenated: a caller's width or backdrop class has to beat the default here.
      className={cn(
        'fixed inset-0 m-auto border-0 p-0 text-on-surface backdrop:bg-black/60 backdrop:backdrop-blur-sm',
        className,
      )}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onMouseDown={(event) => {
        if (!closeOnBackdrop || event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const clickedOutside = event.clientX < bounds.left
          || event.clientX > bounds.right
          || event.clientY < bounds.top
          || event.clientY > bounds.bottom;
        if (clickedOutside) requestClose();
      }}
      ref={dialogRef}
      style={{
        maxHeight: 'calc(100dvh - 1rem)',
        maxWidth: 'calc(100vw - 1rem)',
        ...style,
      }}
    >
      {children}
    </dialog>
  );
};
