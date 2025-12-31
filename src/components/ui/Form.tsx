// src/components/ui/Form.tsx

import { ReactNode, FormHTMLAttributes, forwardRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';

// 验证规则选项
interface ValidateOptions {
  required?: string | boolean;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  validate?: (value: any) => string | boolean;
  email?: string | boolean;
  password?: { 
    value: boolean;
    message?: string;
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecialChar?: boolean;
  };
}

// 表单字段注册选项
interface RegisterOptions {
  validate?: ValidateOptions;
  [key: string]: any;
}

// 表单属性接口
interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  initialValues?: Record<string, any>;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  className?: string;
}

// 表单上下文接口
interface FormContextType {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  register: (name: string, options?: RegisterOptions) => any;
  validateField: (name: string) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  reset: () => void;
  submitting: boolean;
}

// 创建表单上下文
import { createContext, useContext } from 'react';
const FormContext = createContext<FormContextType>({
  values: {},
  errors: {},
  touched: {},
  setValues: () => {},
  setErrors: () => {},
  setTouched: () => {},
  register: () => {},
  validateField: async () => false,
  validateForm: async () => false,
  reset: () => {},
  submitting: false
});

// 表单项属性接口
interface FormItemProps {
  children: ReactNode;
  label?: ReactNode;
  name: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
}

// 表单控制属性接口
interface FormControlProps {
  children: ReactNode;
  className?: string;
}

// 表单错误提示属性接口
interface FormErrorMessageProps {
  name: string;
  className?: string;
}

// 表单验证工具函数
const validateFieldValue = (value: any, validateOptions?: ValidateOptions): string | null => {
  if (!validateOptions) return null;

  // 必填验证
  if (validateOptions.required) {
    const isEmpty = value === undefined || value === null || value === '';
    if (isEmpty) {
      return typeof validateOptions.required === 'string' ? validateOptions.required : '此字段为必填项';
    }
  }

  // 邮箱验证
  if (validateOptions.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return typeof validateOptions.email === 'string' ? validateOptions.email : '请输入有效的邮箱地址';
    }
  }

  // 最小长度验证
  if (validateOptions.minLength) {
    if (value.length < validateOptions.minLength.value) {
      return validateOptions.minLength.message;
    }
  }

  // 最大长度验证
  if (validateOptions.maxLength) {
    if (value.length > validateOptions.maxLength.value) {
      return validateOptions.maxLength.message;
    }
  }

  // 正则表达式验证
  if (validateOptions.pattern) {
    if (!validateOptions.pattern.value.test(value)) {
      return validateOptions.pattern.message;
    }
  }

  // 密码强度验证
  if (validateOptions.password?.value) {
    const passwordOptions = validateOptions.password;
    const minLength = passwordOptions.minLength || 8;
    
    if (value.length < minLength) {
      return passwordOptions.message || `密码长度不能少于${minLength}个字符`;
    }
    
    if (passwordOptions.requireUppercase && !/[A-Z]/.test(value)) {
      return passwordOptions.message || '密码必须包含至少一个大写字母';
    }
    
    if (passwordOptions.requireLowercase && !/[a-z]/.test(value)) {
      return passwordOptions.message || '密码必须包含至少一个小写字母';
    }
    
    if (passwordOptions.requireNumber && !/\d/.test(value)) {
      return passwordOptions.message || '密码必须包含至少一个数字';
    }
    
    if (passwordOptions.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      return passwordOptions.message || '密码必须包含至少一个特殊字符';
    }
  }

  // 自定义验证函数
  if (validateOptions.validate) {
    const result = validateOptions.validate(value);
    if (typeof result === 'string') {
      return result;
    }
    if (result === false) {
      return '验证失败';
    }
  }

  return null;
};

// 表单组件
const Form = forwardRef<HTMLFormElement, FormProps>(({
  children,
  onSubmit,
  initialValues = {},
  validateOnBlur = true,
  validateOnChange = true, // 默认开启实时验证
  className,
  ...props
}, ref) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  // 存储每个字段的验证规则
  const [validationRules, setValidationRules] = useState<Record<string, ValidateOptions>>({});

  // 重置表单
  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  // 注册表单字段
  const register = (name: string, options: RegisterOptions = {}) => {
    // 保存验证规则
    if (options.validate) {
      setValidationRules(prev => ({
        ...prev,
        [name]: options.validate as ValidateOptions
      }));
    }

    return {
      name,
      value: values[name] || '',
      onChange: (e: React.ChangeEvent<any>) => {
        const newValue = e.target.value;
        setValues(prev => ({ ...prev, [name]: newValue }));
        
        // 实时验证
        if (validateOnChange && options.validate) {
          const error = validateFieldValue(newValue, options.validate);
          setErrors(prev => ({ ...prev, [name]: error || '' }));
        }
      },
      onBlur: () => {
        setTouched(prev => ({ ...prev, [name]: true }));
        
        // 失焦验证
        if (validateOnBlur && options.validate) {
          const error = validateFieldValue(values[name], options.validate);
          setErrors(prev => ({ ...prev, [name]: error || '' }));
        }
      },
      ...options
    };
  };

  // 验证单个字段
  const validateField = async (name: string) => {
    const value = values[name];
    const rules = validationRules[name];
    
    if (!rules) return true;
    
    const error = validateFieldValue(value, rules);
    setErrors(prev => ({ ...prev, [name]: error || '' }));
    return !error;
  };

  // 验证整个表单
  const validateForm = async () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    // 验证所有有规则的字段
    Object.keys(validationRules).forEach(name => {
      const value = values[name];
      const rules = validationRules[name];
      const error = validateFieldValue(value, rules);
      
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    // 标记所有字段为已触摸
    setTouched(prev => {
      const newTouched: Record<string, boolean> = { ...prev };
      Object.keys(validationRules).forEach(key => {
        newTouched[key] = true;
      });
      return newTouched;
    });
    
    return isValid;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // 验证表单
      const isValid = await validateForm();
      if (isValid) {
        await onSubmit(values);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // 提供表单上下文
  const contextValue: FormContextType = {
    values,
    errors,
    touched,
    setValues,
    setErrors,
    setTouched,
    register,
    validateField,
    validateForm,
    reset,
    submitting
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={clsx('space-y-4', className)}
        {...props}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
});

Form.displayName = 'Form';

// 表单项组件
const FormItem = ({ children, label, name, required = false, className, labelClassName }: FormItemProps) => {
  const { errors, touched } = useContext(FormContext);
  const hasError = touched[name] && errors[name];

  return (
    <div className={clsx('space-y-2', className)}>
      {label && (
        <label className={clsx('block text-sm font-medium text-gray-700 dark:text-gray-300', labelClassName)}>
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <div className={clsx(hasError && 'has-error')}>
        {children}
      </div>
    </div>
  );
};

// 表单控制组件
const FormControl = ({ children, className }: FormControlProps) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

// 表单错误提示组件
const FormErrorMessage = ({ name, className }: FormErrorMessageProps) => {
  const { errors, touched } = useContext(FormContext);
  const hasError = touched[name] || (errors[name] !== undefined);
  const errorMessage = errors[name];

  if (!hasError || !errorMessage) return null;

  return (
    <p className={clsx('text-xs text-danger mt-1 flex items-center', className)}>
      <i className="fas fa-exclamation-circle mr-1 text-xs"></i>
      {errorMessage}
    </p>
  );
};

// 使用表单上下文的钩子
export const useFormContext = () => useContext(FormContext);

// 常用验证规则
export const validationRules = {
  required: (message: string = '此字段为必填项') => ({ required: message }),
  email: (message: string = '请输入有效的邮箱地址') => ({ email: message }),
  minLength: (value: number, message: string) => ({ minLength: { value, message } }),
  maxLength: (value: number, message: string) => ({ maxLength: { value, message } }),
  password: (options?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecialChar?: boolean;
    message?: string;
  }) => {
    const defaults = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecialChar: true,
      message: '密码必须包含至少8个字符，包括大小写字母、数字和特殊字符'
    };
    
    const config = { ...defaults, ...options };
    
    return {
      password: {
        value: true,
        ...config
      }
    };
  },
  pattern: (value: RegExp, message: string) => ({ pattern: { value, message } })
};

export { Form, FormItem, FormControl, FormErrorMessage };