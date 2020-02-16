import { observer } from "mobx-react";
import React, { useState } from "react";
import styled from "@emotion/styled";
import { useStore } from "shared/hooks";
import {
  formatAsset,
  formatBlockExplorerTransaction
} from "@deltalabs/eos-utils";
import {
  Box,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  FormControl,
  InputLeftAddon,
  Heading
} from "@chakra-ui/core";
import { TGroupedTransfer } from "modules/root/store/token";
import { getColorForBucket } from "../logic";
import { useForm } from "react-hook-form";

const ListItemBox = styled(Box)`
  display: inline-block;
  text-align: center;
`;

const TransfersFilter: React.FC = () => {
  const [userStore, tokenStore] = useStore(rootStore => [
    rootStore.userStore,
    rootStore.tokenStore
  ]);

  const { handleSubmit, errors, register } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = values => {
    setIsSubmitting(true);

    tokenStore.handleMinBalanceFilterSubmit(values.minBalanceFilter);
    setIsSubmitting(false);
  };

  const validateNumber = value => {
    return /^\d*(\.\d+){0,1}$/.test(value);
  };

  return (
    <Flex flexDir="column" alignItems="center" w="100%" mb="8">
      <Heading as="h4" fontSize="lg" mb="1">
        Filters
      </Heading>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormControl isInvalid={Boolean(errors.minBalanceFilter)}>
          <InputGroup>
            <InputLeftAddon children="Min Balance" />
            <Input
              name="minBalanceFilter"
              placeholder="0.01"
              w="64"
              focusBorderColor="teal.200"
              ref={register({ validate: validateNumber })}
              defaultValue={tokenStore.minBalanceFilter}
            />
            <InputRightElement>
              <IconButton
                variantColor="teal"
                aria-label="Apply Filter"
                fontSize="20px"
                icon="check"
                type="submit"
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>
      </form>
    </Flex>
  );
};

export default observer(TransfersFilter);
