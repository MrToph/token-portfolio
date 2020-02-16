import React, { useState } from "react";
import {
  VictoryChart,
  VictoryZoomContainer,
  VictoryLine,
  VictoryBrushContainer,
  VictoryAxis,
  VictoryTheme,
  VictoryLabel,
  VictoryTooltip
} from "victory";
import { Flex, useTheme } from "@chakra-ui/core";
import { useStore } from "shared/hooks";
import { observer } from "mobx-react";

type State = {
  zoomDomain: any;
  selectedDomain: any;
};
type Props = {};
const TransfersChart: React.FC<{}> = props => {
  const [tokenStore] = useStore(rootStore => [rootStore.tokenStore]);
  const theme = useTheme();

  const [state, setState] = useState<State>({
    zoomDomain: undefined,
    selectedDomain: undefined
  });

  const handleBrush = domain => {
    setState({ ...state, zoomDomain: domain });
  };

  const chartWidth = Number.parseInt(theme.sizes[`6xl`]) * 16 /* 1rem */;
  const chartHeight = 480;

  return (
    <Flex
      flexDir="column"
      alignItems="center"
      maxW="100%"
      w="6xl"
      height={chartHeight}
      marginX="auto"
      marginTop="12"
      marginBottom="48"
    >
      <VictoryChart
        width={chartWidth}
        height={chartHeight}
        scale={{ x: "time" }}
        theme={VictoryTheme.material}
        domain={state.zoomDomain}
        padding={{ left: 100, right: 50, top: 50, bottom: 50 }}
        domainPadding={{ x: [10, 10], y: [10, 60]}}
      >
        <VictoryLine
          style={{
            data: { stroke: theme.colors.teal[500] },
            labels: {
              fontSize: 15,
              fill: theme.colors.teal[500]
            }
          }}
          data={tokenStore.groupedTransfersDataPoints}
          labels={({ datum }) => datum.y}
          labelComponent={<VictoryLabel />}
        />
        <VictoryAxis
          crossAxis
          style={{
            tickLabels: {
              fill: theme.colors.gray[`500`],
              stroke: theme.colors.gray[`500`],
              fontSize: 16
            },
            axis: { stroke: theme.colors.gray[`700`] },
            grid: { stroke: theme.colors.gray[`700`] }
          }}
        />
        <VictoryAxis
          crossAxis
          dependentAxis
          style={{
            tickLabels: {
              fill: theme.colors.teal[`500`],
              stroke: theme.colors.teal[`500`],
              fontSize: 16
            },
            axis: { stroke: theme.colors.gray[`700`] },
            grid: { stroke: theme.colors.gray[`700`] }
          }}
        />
      </VictoryChart>

      <VictoryChart
        padding={{ top: 0, left: 50, right: 50, bottom: 30 }}
        width={600}
        height={90}
        scale={{ x: "time" }}
        theme={VictoryTheme.material}
        containerComponent={
          <VictoryBrushContainer
            responsive={false}
            brushStyle={{
              stroke: "transparent",
              fill: theme.colors.teal[200],
              fillOpacity: 0.2
            }}
            brushDomain={state.selectedDomain}
            onBrushDomainChange={handleBrush}
          />
        }
      >
        <VictoryAxis
          tickValues={tokenStore.groupedTransfersDates}
          tickFormat={x => (x as Date).toLocaleDateString()}
          style={{
            tickLabels: {
              fill: theme.colors.gray[`500`],
              stroke: theme.colors.gray[`500`],
            },
          }}
        />
        <VictoryLine
          style={{
            data: { stroke: theme.colors.teal[500] }
          }}
          data={tokenStore.groupedTransfersDataPoints}
        />
      </VictoryChart>
    </Flex>
  );
};

export default observer(TransfersChart);
