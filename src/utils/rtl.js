export const IS_RTL = true;

export const RTL_DIRECTION = {
  direction: 'rtl',
  writingDirection: 'rtl',
};

export const RTL_TEXT = {
  ...RTL_DIRECTION,
  textAlign: 'right',
};

export const RTL_ROW = {
  flexDirection: 'row-reverse',
};

export const RTL_ROW_CENTER = {
  ...RTL_ROW,
  alignItems: 'center',
};

export const PHYSICAL_ROW = {
  flexDirection: 'row',
  direction: 'ltr',
};

export const PHYSICAL_ROW_CENTER = {
  ...PHYSICAL_ROW,
  alignItems: 'center',
};

export const RTL_ICONS = {
  back: IS_RTL ? 'arrow-forward' : 'arrow-back',
  forward: IS_RTL ? 'arrow-back' : 'arrow-forward',
  chevronBack: IS_RTL ? 'chevron-right' : 'chevron-left',
  chevronForward: IS_RTL ? 'chevron-left' : 'chevron-right',
};
