import crypto from "crypto";

export const generateState = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const validateState = (
  sessionState: string | undefined,
  receivedState: string | undefined
): boolean => {
  console.log(
    `validateState called with sessionState: ${sessionState || "undefined"}`
  );
  console.log(
    `validateState called with receivedState: ${receivedState || "undefined"}`
  );

  if (!sessionState) {
    console.warn("Session state is missing or undefined");
    return false;
  }

  if (!receivedState) {
    console.warn("Received state is missing or undefined");
    return false;
  }

  const isValid = sessionState === receivedState;
  console.log(`State validation result: ${isValid ? "VALID" : "INVALID"}`);
  return isValid;
};
