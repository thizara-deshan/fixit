import { Toaster as Sonner, type ToasterProps } from 'sonner';

/** SPEC §6.5 toast: tooltip-bg, r14, 14/600 white, action 14/700 toast-action. Sonner pauses the timer on hover and focus. */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      visibleToasts={1}
      offset={28}
      mobileOffset={16}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-center gap-3 rounded-lg bg-tooltip-bg py-3 pl-[18px] pr-4 text-label font-semibold text-primary-foreground shadow-toast sm:w-max sm:max-w-[480px]',
          title: 'min-w-0 flex-1',
          icon: 'shrink-0 text-primary-foreground',
          actionButton:
            'ml-auto inline-flex min-h-11 shrink-0 items-center px-1 text-label font-bold text-toast-action focus-visible:outline-primary-foreground sm:min-h-0',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
