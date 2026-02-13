'use client';

import React, { useState } from 'react';

interface FieldSchema {
  type: string;
  description?: string;
  enum?: string[];
  items?: any;
  properties?: Record<string, FieldSchema>;
}

interface ToolSchema {
  type: 'object';
  properties: Record<string, FieldSchema>;
  required?: string[];
}

interface DynamicToolFormProps {
  toolId: string;
  toolName: string;
  inputSchema: ToolSchema;
  onSubmit: (values: Record<string, any>) => void;
  isSubmitting?: boolean;
}

export default function DynamicToolForm({
  toolId,
  toolName,
  inputSchema,
  onSubmit,
  isSubmitting = false,
}: DynamicToolFormProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (fieldName: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const required = inputSchema.required || [];

    for (const fieldName of required) {
      const value = values[fieldName];
      if (value === undefined || value === null || value === '') {
        newErrors[fieldName] = 'This field is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(values);
    }
  };

  const renderField = (fieldName: string, fieldSchema: FieldSchema) => {
    const isRequired = inputSchema.required?.includes(fieldName);
    const value = values[fieldName] || '';
    const error = errors[fieldName];

    // Handle different field types
    if (fieldSchema.enum) {
      return (
        <div key={fieldName} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {fieldName}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          {fieldSchema.description && (
            <p className="text-xs text-gray-500 mb-1">{fieldSchema.description}</p>
          )}
          <select
            value={value}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select...</option>
            {fieldSchema.enum.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      );
    }

    if (fieldSchema.type === 'boolean') {
      return (
        <div key={fieldName} className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleChange(fieldName, e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">
              {fieldName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
          {fieldSchema.description && (
            <p className="text-xs text-gray-500 ml-6">{fieldSchema.description}</p>
          )}
        </div>
      );
    }

    if (fieldSchema.type === 'number') {
      return (
        <div key={fieldName} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {fieldName}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          {fieldSchema.description && (
            <p className="text-xs text-gray-500 mb-1">{fieldSchema.description}</p>
          )}
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(fieldName, parseFloat(e.target.value))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      );
    }

    if (fieldSchema.type === 'object' || fieldSchema.type === 'array') {
      return (
        <div key={fieldName} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {fieldName}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          {fieldSchema.description && (
            <p className="text-xs text-gray-500 mb-1">{fieldSchema.description}</p>
          )}
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleChange(fieldName, parsed);
              } catch {
                handleChange(fieldName, e.target.value);
              }
            }}
            rows={4}
            placeholder={fieldSchema.type === 'array' ? '[]' : '{}'}
            className={`w-full px-3 py-2 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      );
    }

    // Default: string input
    return (
      <div key={fieldName} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {fieldName}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        {fieldSchema.description && (
          <p className="text-xs text-gray-500 mb-1">{fieldSchema.description}</p>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(fieldName, e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{toolName}</h3>
        {Object.entries(inputSchema.properties).map(([fieldName, fieldSchema]) =>
          renderField(fieldName, fieldSchema)
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
