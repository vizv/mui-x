import * as React from 'react';
import clsx from 'clsx';
import { styled, useThemeProps } from '@mui/material/styles';
import { unstable_composeClasses as composeClasses } from '@mui/utils';
import { CLOCK_WIDTH, CLOCK_HOUR_WIDTH } from './shared';
import { ClockPickerView } from '../internals/models';
import { ClockPointerClasses, getClockPointerUtilityClass } from './clockPointerClasses';

export interface ClockPointerProps extends React.HTMLAttributes<HTMLDivElement> {
  hasSelected: boolean;
  isInner: boolean;
  type: ClockPickerView;
  viewValue: number;
  classes?: Partial<ClockPointerClasses>;
}

interface ClockPointerState {
  shouldAnimate: boolean;
}

const useUtilityClasses = (ownerState: ClockPointerProps) => {
  const { classes } = ownerState;
  const slots = {
    root: ['root'],
    thumb: ['thumb'],
  };

  return composeClasses(slots, getClockPointerUtilityClass, classes);
};

const ClockPointerRoot = styled('div', {
  name: 'MuiClockPointer',
  slot: 'Root',
  overridesResolver: (_, styles) => styles.root,
})<{
  ownerState: ClockPointerProps & ClockPointerState;
}>(({ theme, ownerState }) => ({
  width: 2,
  backgroundColor: theme.palette.primary.main,
  position: 'absolute',
  left: 'calc(50% - 1px)',
  bottom: '50%',
  transformOrigin: 'center bottom 0px',
  ...(ownerState.shouldAnimate && {
    transition: theme.transitions.create(['transform', 'height']),
  }),
}));

const ClockPointerThumb = styled('div', {
  name: 'MuiClockPointer',
  slot: 'Thumb',
  overridesResolver: (_, styles) => styles.thumb,
})<{
  ownerState: ClockPointerProps & ClockPointerState;
}>(({ theme, ownerState }) => ({
  width: 4,
  height: 4,
  backgroundColor: theme.palette.primary.contrastText,
  borderRadius: '50%',
  position: 'absolute',
  top: -21,
  left: `calc(50% - ${CLOCK_HOUR_WIDTH / 2}px)`,
  border: `${(CLOCK_HOUR_WIDTH - 4) / 2}px solid ${theme.palette.primary.main}`,
  boxSizing: 'content-box',
  ...(ownerState.hasSelected && {
    backgroundColor: theme.palette.primary.main,
  }),
}));

/**
 * @ignore - internal component.
 */
export function ClockPointer(inProps: ClockPointerProps) {
  const props = useThemeProps({ props: inProps, name: 'MuiClockPointer' });
  const { className, hasSelected, isInner, type, viewValue, ...other } = props;
  const previousType = React.useRef<ClockPickerView | null>(type);
  React.useEffect(() => {
    previousType.current = type;
  }, [type]);

  const ownerState = { ...props, shouldAnimate: previousType.current !== type };
  const classes = useUtilityClasses(ownerState);

  const getAngleStyle = () => {
    const max = type === 'hours' ? 12 : 60;
    let angle = (360 / max) * viewValue;

    if (type === 'hours' && viewValue > 12) {
      angle -= 360; // round up angle to max 360 degrees
    }

    return {
      height: Math.round((isInner ? 0.26 : 0.4) * CLOCK_WIDTH),
      transform: `rotateZ(${angle}deg)`,
    };
  };

  return (
    <ClockPointerRoot
      style={getAngleStyle()}
      className={clsx(className, classes.root)}
      ownerState={ownerState}
      {...other}
    >
      <ClockPointerThumb ownerState={ownerState} className={classes.thumb} />
    </ClockPointerRoot>
  );
}
