const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,16}$/;

const validateName = (name) => {
  const clean = typeof name === "string" ? name.trim() : "";
  if (clean.length < 20 || clean.length > 60) {
    return "Name must be between 20 and 60 characters.";
  }
  return null;
};

const validateEmail = (email) => {
  const clean = typeof email === "string" ? email.trim() : "";
  if (!EMAIL_REGEX.test(clean)) {
    return "Please enter a valid email address.";
  }
  return null;
};

const validateAddress = (address) => {
  const clean = typeof address === "string" ? address.trim() : "";
  if (!clean) {
    return "Address is required.";
  }
  if (clean.length > 400) {
    return "Address must not exceed 400 characters.";
  }
  return null;
};

const validatePassword = (password) => {
  if (typeof password !== "string" || !PASSWORD_REGEX.test(password)) {
    return "Password must be 8–16 characters and include at least one uppercase letter and one special character.";
  }
  return null;
};

module.exports = {
  validateName,
  validateEmail,
  validateAddress,
  validatePassword
};