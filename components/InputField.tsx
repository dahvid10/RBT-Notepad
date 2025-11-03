
import React from 'react';

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, type = 'text', placeholder, required = false, error }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {type === 'textarea' ? (
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={3}
        className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500'}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
    ) : (
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500'}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
    )}
    {error && <p id={`${name}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
  </div>
);
