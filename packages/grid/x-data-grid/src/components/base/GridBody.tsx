import * as React from 'react';
import PropTypes from 'prop-types';
import { useGridPrivateApiContext } from '../../hooks/utils/useGridPrivateApiContext';
import { ElementSize } from '../../models/elementSize';
import { GridMainContainer } from '../containers/GridMainContainer';
import { GridAutoSizer } from '../GridAutoSizer';
import { useGridRootProps } from '../../hooks/utils/useGridRootProps';
import { useGridSelector } from '../../hooks/utils/useGridSelector';
import { gridTotalHeaderHeightSelector } from '../../hooks/features/columnGrouping/gridColumnGroupsSelector';

interface GridBodyProps {
  children?: React.ReactNode;
  VirtualScrollerComponent: React.JSXElementConstructor<
    React.HTMLAttributes<HTMLDivElement> & {
      ref: React.Ref<HTMLDivElement>;
      disableVirtualization: boolean;
    }
  >;

  ColumnHeadersComponent: React.JSXElementConstructor<
    React.HTMLAttributes<HTMLDivElement> & {
      ref: React.Ref<HTMLDivElement>;
      innerRef: React.Ref<HTMLDivElement>;
    }
  >;
}

function GridBody(props: GridBodyProps) {
  const { children, VirtualScrollerComponent, ColumnHeadersComponent } = props;
  const apiRef = useGridPrivateApiContext();
  const rootProps = useGridRootProps();
  const totalHeaderHeight = useGridSelector(apiRef, gridTotalHeaderHeightSelector);
  const [isVirtualizationDisabled, setIsVirtualizationDisabled] = React.useState(
    rootProps.disableVirtualization,
  );

  const disableVirtualization = React.useCallback(() => {
    setIsVirtualizationDisabled(true);
  }, []);

  const enableVirtualization = React.useCallback(() => {
    setIsVirtualizationDisabled(false);
  }, []);

  React.useEffect(() => {
    setIsVirtualizationDisabled(rootProps.disableVirtualization);
  }, [rootProps.disableVirtualization]);

  // The `useGridApiMethod` hook can't be used here, because it only installs the
  // method if it doesn't exist yet. Once installed, it's never updated again.
  // This break the methods above, since their closure comes from the first time
  // they were installed. Which means that calling `setIsVirtualizationDisabled`
  // will trigger a re-render, but it won't update the state. That can be solved
  // by migrating the virtualization status to the global state.
  apiRef.current.unstable_disableVirtualization = disableVirtualization;
  apiRef.current.unstable_enableVirtualization = enableVirtualization;

  const columnHeadersRef = React.useRef<HTMLDivElement>(null);
  const columnsContainerRef = React.useRef<HTMLDivElement>(null);
  const windowRef = React.useRef<HTMLDivElement>(null);
  const renderingZoneRef = React.useRef<HTMLDivElement>(null);

  apiRef.current.columnHeadersContainerElementRef = columnsContainerRef;
  apiRef.current.columnHeadersElementRef = columnHeadersRef;
  apiRef.current.windowRef = windowRef; // TODO rename, it's not attached to the window anymore
  apiRef.current.renderingZoneRef = renderingZoneRef; // TODO remove, nobody should have access to internal parts of the virtualization

  const handleResize = React.useCallback(
    (size: ElementSize) => {
      apiRef.current.publishEvent('resize', size);
    },
    [apiRef],
  );

  return (
    <GridMainContainer>
      <ColumnHeadersComponent ref={columnsContainerRef} innerRef={columnHeadersRef} />
      <GridAutoSizer
        nonce={rootProps.nonce}
        disableHeight={rootProps.autoHeight}
        onResize={handleResize}
      >
        {(size: { height?: number; width: number }) => {
          const style = {
            width: size.width,
            // If `autoHeight` is on, there will be no height value.
            // In this case, let the container to grow whatever it needs.
            height: size.height ? size.height - totalHeaderHeight : 'auto',
            marginTop: totalHeaderHeight,
          } as React.CSSProperties;

          return (
            <VirtualScrollerComponent
              ref={windowRef}
              style={style}
              disableVirtualization={isVirtualizationDisabled}
            />
          );
        }}
      </GridAutoSizer>
      {children}
    </GridMainContainer>
  );
}

GridBody.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  children: PropTypes.node,
  ColumnHeadersComponent: PropTypes.elementType.isRequired,
  VirtualScrollerComponent: PropTypes.elementType.isRequired,
} as any;

export { GridBody };
