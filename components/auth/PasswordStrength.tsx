
import React from 'react';
import { CheckIcon, XIcon } from '../Icons';

interface PasswordStrengthProps {
  isValid: boolean;
  label: string;
}

const Requirement: React.FC<PasswordStrengthProps> = ({ isValid, label }) => (
  <li className={`flex items-center transition-colors ${isValid ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
    {isValid ? <CheckIcon className="mr-2" /> : <XIcon className="mr-2" />}
    <span className="text-sm">{label}</span>
  </li>
);

interface Props {
  password?: string;
}

const PasswordStrength: React.FC<Props> = ({ password = '' }) => {
  const validations = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  return (
    <ul className="space-y-2 mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
      <Requirement isValid={validations.length} label="At least 8 characters" />
      <Requirement isValid={validations.uppercase} label="One uppercase letter (A-Z)" />
      <Requirement isValid={validations.lowercase} label="One lowercase letter (a-z)" />
      <Requirement isValid={validations.number} label="One number (0-9)" />
      <Requirement isValid={validations.special} label="One special character (e.g., !@#$)" />
    </ul>
  );
};

export default PasswordStrength;
