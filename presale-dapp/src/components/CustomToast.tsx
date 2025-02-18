import React from 'react';
import { toast, ToastOptions } from 'react-toastify';
import { FiCheck, FiX, FiInfo, FiAlertTriangle } from 'react-icons/fi';

interface ToastConfig {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

const Icons = {
  success: <FiCheck className="text-[#36D4C7]" size={20} />,
  error: <FiX className="text-red-500" size={20} />,
  info: <FiInfo className="text-[#0194FC]" size={20} />,
  warning: <FiAlertTriangle className="text-amber-500" size={20} />,
};

const defaultConfig: ToastOptions = {
  position: 'top-right',
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

export const showToast = ({ message, type = 'info', duration }: ToastConfig) => {
  const toastConfig: ToastOptions = {
    ...defaultConfig,
    autoClose: duration || defaultConfig.autoClose,
    icon: Icons[type],
  };

  return toast[type](
    <div className="flex items-center">
      <span className="ml-2 text-sm font-medium">{message}</span>
    </div>,
    toastConfig
  );
};
