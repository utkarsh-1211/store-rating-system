const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,16}$/;

export const validateName = (name) => {
  const clean = typeof name === "string" ? name.trim() : "";
  if (clean.length < 20 || clean.length > 60) {
    return "Name must be between 20 and 60 characters.";
  }
  return "";
};

export const validateEmail = (email) => {
  const clean = typeof email === "string" ? email.trim() : "";
  if (!EMAIL_REGEX.test(clean)) {
    return "Please enter a valid email address.";
  }
  return "";
};

export const validateAddress = (address) => {
  const clean = typeof address === "string" ? address.trim() : "";
  if (!clean) {
    return "Address is required.";
  }
  if (clean.length > 400) {
    return "Address must not exceed 400 characters.";
  }
  return "";
};

export const validatePassword = (password) => {
  if (typeof password !== "string" || !PASSWORD_REGEX.test(password)) {
    return "Password must be 8–16 characters with at least 1 uppercase letter and 1 special character.";
  }
  return "";
};