import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { isName } from "@deltalabs/eos-utils/dist/name";
import {
  Box,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  FormControl
} from "@chakra-ui/core";
import { useStore } from "shared/hooks";

const NavBar: React.FC = () => {
  const userStore = useStore(rootStore => rootStore.userStore);

  const { handleSubmit, errors, register } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = values => {
    setIsSubmitting(true);

    userStore.handleUserNameSubmit(values.name)
    setIsSubmitting(false);
  };

  const validateName = value => {
    return isName(value) ? true : `Not a valid EOSIO account name`;
  };

  return (
    <Flex w="100%" h="16" justifyContent="center" alignItems="center">
      <Flex
        w="100%"
        maxW="4xl"
        alignItems="center"
        justifyContent="space-between"
      >
        <Box
          textTransform="uppercase"
          letterSpacing="tight"
          fontSize="xl"
          fontWeight="bold"
        >
          Token Portfolio
        </Box>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControl isInvalid={Boolean(errors.name)}>
            <InputGroup>
              <Input
                name="name"
                placeholder="account"
                w="64"
                maxLength={13}
                autoFocus
                focusBorderColor="teal.200"
                ref={register({ validate: validateName })}
                defaultValue={userStore.accountName}
              />
              <InputRightElement>
                <IconButton
                  variantColor="teal"
                  aria-label="Call Sage"
                  fontSize="20px"
                  icon="search"
                  type="submit"
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>
        </form>
      </Flex>
    </Flex>
  );
};

export default NavBar;
