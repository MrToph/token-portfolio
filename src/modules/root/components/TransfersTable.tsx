import { observer } from "mobx-react";
import React from "react";
import styled from "@emotion/styled";
import { useStore } from "shared/hooks";
import {
  formatAsset,
  formatBlockExplorerTransaction
} from "@deltalabs/eos-utils";
import {
  List,
  ListItem,
  ListIcon,
  Flex,
  Heading,
  Box,
  Link,
  Icon,
  Code
} from "@chakra-ui/core";
import { TGroupedTransfer } from "modules/root/store/token";
import { getColorForBucket } from "../logic";
import TransfersFilter from "./TransfersFilter";

const ListItemBox = styled(Box)`
  display: inline-block;
  text-align: center;
`;

// const ListItemHeaderBox = styled(ListItemBox)`
//   text-transform: uppercase;
//   font-size: 16px;
// `;

const MyListItem: React.FC<{ trx: TGroupedTransfer }> = ({
  trx,
  ...otherProps
}) => {
  const isPositive = !trx.deltaQuantity.amount.isNegative();
  return (
    <ListItem py="4" px="6" backgroundColor="gray.700" {...otherProps}>
      <ListItemBox w="48">{trx.timestamp.toLocaleString()}</ListItemBox>
      <ListItemBox w="32">{trx.party}</ListItemBox>
      <ListItemBox w="32" color={getColorForBucket(isPositive, trx.impact)}>
        {formatAsset(trx.deltaQuantity)}
      </ListItemBox>
      <ListItemBox w="48" fontWeight={700}>
        {formatAsset(trx.balance)}
      </ListItemBox>
      <ListItemBox w="32">
        <Link
          display="flex"
          flexDir="row"
          alignItems="center"
          lineHeight="1.5em"
          href={formatBlockExplorerTransaction(`eosq`)(trx.trxId)}
          isExternal
        >
          <Code backgroundColor="transparent">
            {trx.trxId.slice(0, 4)}..{trx.trxId.slice(-4)}
          </Code>
          <Icon name="external-link" ml="1" />
        </Link>
      </ListItemBox>
    </ListItem>
  );
};

const TransfersTable: React.FC = () => {
  const [userStore, tokenStore] = useStore(rootStore => [
    rootStore.userStore,
    rootStore.tokenStore
  ]);

  return (
    <Flex
      flexDir="column"
      alignItems="center"
      maxW="100%"
      w="6xl"
      marginX="auto"
      marginY="12"
    >
      <Heading as="h2" size="xl" mb="4">
        Your Transfers
      </Heading>
      <TransfersFilter />
      <List spacing={1} fontSize="sm">
      <ListItem py="4" px="6" textTransform="uppercase">
      <ListItemBox w="48">Time</ListItemBox>
      <ListItemBox w="32">Party</ListItemBox>
      <ListItemBox w="32">
        Δ Balance
      </ListItemBox>
      <ListItemBox w="48">
        Balance
      </ListItemBox>
      <ListItemBox w="32">
        Transaction
      </ListItemBox>
    </ListItem>
        {Object.values(tokenStore.groupedTransfers).map(trx => (
          <MyListItem key={trx.trxId} trx={trx} />
        ))}
      </List>
    </Flex>
  );
};

export default observer(TransfersTable);
